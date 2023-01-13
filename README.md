# rxome-qrcode-generator
Generates QR codes containing medical information for use with the RxOME database.
**Right now, it works only with the test API**

## LICENSE

Copyright (c) 2022 MGZ-Tech GmbH, GeneTalk GmbH

All rights reserved, unauthorized use prohibited.

## Purpose

This package offers a JavaScript library for generating QR codes from medical data as well as
a command line tool as front end to this library. Both expect the medical data in JSON format
according to a subset of the PhenoPacket standard (with some additions), see below. 
The medical data will be encrypted before generating the QR code. This encrypted data can be decrypted
by the database backend only. The meta data is transmitted unencrypted.

Every QR code is tagged with a unique pseudonym that is downloaded from the RxOME server. Thus, the tools
require an active internet connection. Furthermore, the user or the facility applying the QR generator has to sign up to the RxOME server. The communication to the server API is secured with a protocol that uses an
asymmetric pair of keys, a private key (the API access key) is used to sign the API enquiry,
a public key is uploaded to the server and used to verify the signature,
see generating user credentials.

When generating a QR code and, thus, downloading a pseudonym, the user needs to specify the
corresponding credentials (keyID and key) for accessing the RxOME server.
The command line tool offers command line options for the API access credentials. Further, they
can be specified in the input JSON file (see 'MetaData and credentials' below), 
where the command line options precede the data in the JSON file.

In case the patient already has a pseudonym that will be used for the QR code, 
the known pseudonym can be specified in the MetaData section of the input JSON data. 
Additionally, the command line tool
offers a command line argument, `-p`, for specifying a known pseudonym.

By default, the keywords in the JSON file are expected to be noted in camelCase. However, the tool
can convert snake_case to camelCase (command line: -s, library: function convertToCamelCase).


## Basic Usage

###Command Line Tool

Generate a QR code *inputfile*.png from a JSON file *inputfile*.json containing all medical data in PhenoPacket format, meta data and credentials (using camelCase for keywords):

> `rxcode g` *inputfile*.json

For detailed descriptions see 
> `rxcode g --help`

###Library Functions
Import the library with
> `const Coder = require( 'rxome-generator' );`

The following two async library functions generate QR codes:
> `Coder.writeQR( filename, data, api = RXAPI )`

> *filename*: name for PNG file with the QR code<br/>
> *data*: object containing medical data, meta data, and credentials (format: see below)<br/>
> *api*: omit in production mode, set to `Coder.TESTAPI` in test mode.

This function creates the QR code from the given data and writes it as PNG file specified by *filename*. 
The credentials for accessing the RxOME API (i.e., fetching a pseudonym and the encryption key) have to be
part of the data object (see below). Returns the pseudonym used to generate the QR code.

> `Coder.makeQR( data, api = RXAPI, apiEntry = APIENTRY )`

Generates a QR code object as Data URL that can be placed on a web page. As above, the credentials are specified as part of the data object. Returns an object:

```
{
    qr_code: (QR code),
    pseudonym: (pseudonym used to generate the QR code)
}
```

Both `writeQR` and `makeQR` take care
of the preprocessing steps (sanitizing, compessing, encoding). However, converting the keys in the data object to camelCase is *not* part of the preprocessing. 
Use the following function to convert keys from snake_case to camelCase:

> `Coder.convertToCamelCase( data )`

Additionally, the data can be verified with

> `Coder.verify( data )`

Note that the credential information perhaps stored in the data package is *not* part of the PhenoPacket standard.

## Modifications to the PhenoPacket Standard
### Meta Data and Credentials
For convenience, all data needed to generate a QR code can be specified in one JSON file 
(or, when using the library functions, one JavaScript object).
In addition to the medical data, the JSON files or objects accepted by rxcode and the 
rxcode library may contain the credentials to access the RxOME API and - if existing - 
the patients pseudonym from earlier issued QR codes.
Note that the information given in the credential section is mandatory 
when using the library functions. 
When using the command line, these data can be part of the input JSON 
or specified using command line arguments. 
Pleace specify *either* a file containing the API access key (keyFile, -k)
*or* the key itself (key, -s).

When a pseudonym is given (either in the meta data or with command line option `-P`), 
the QR code will be generated using this pseudonym. Otherwise, a new one will be 
fetched from the server. In both cases, the
pseudonym used will be part of the output for futher processing or storing.

```
{
  ...
  metaData: {
    ...
     pseudonym: 'anonymous' 
  }
  credentials: {
    keyId: <lab-id/key-id, corresponding to private key>
    key: <private key>
    keyFile: <name of file containing private key> // please specify key OR keyFile
    user: e.g., hans.motkamp@genetalk.de
  }
 
}
```

### Phenotypic Features

The rxome library extends the PhenoPacket schema for storing phenotypicFeatures (HPO terms). In addition the notation suggested by PhenoPackets:

```
"phenotypicFeatures": [
    {
      "type": {
        "id": "HP:0003155"
      }
    },
    {
      "type": {
        "id": "HP:0001249"
      }
    },
    {
      "type": {
        "id": "HP:0001250"
      }
    },    {
      "type": {
        "id": "HP: 0031360"
      },
      "excluded": true
    }
  ]

```

the terms can be stored in a shorter and more convenient form:

```
  "compressedFeatures": {
    "included": [
      "HP:0003155",
      "HP:0001249",
      "HP:0001250"
    ],
    "excluded": [
      "HP:0031360"
    ]
  }
```

### Data Source

The type of genetic test performed to obtain a variant can be specified in an extension field to the genomic interpretation:

```
"genomicInterpretations": [
  [
    {
      "variantInterpretation": {
        "acmgPathogenicityClassification": "Pathogenic",
        "variationDescriptor": {
          "geneContext": {
          "expressions": [
            {
              "syntax": "hgvs.c",
              "value": "NM_017837.4(PIGV):c.1022C>A (p.Ala341Glu)"
            }
          ],
          "allelicState": {
            "id": "GENO_0000136"
          },
          "extensions": [
            {
              "name": "Single gene sequencing"
            }
          ]
        }
      }
    }
  ]
]
```

### Additional Remarks

Additional remarks can be specified in a *comment* field on the top level:

```
{
  "id": "QR-Code ID",
  "comment": "useful remarks",
  "subject": {
...
```

### Whitelist Filter

Before packing the data, needless sections (that is, sections that are not evaluted by RxOME) 
are removed. On top level, the following section will be passed over to the QR code:

*   id
*   comment
*   subject
*   phenotypicFeatures
*   interpretations
*   diagnosis
*   metaData
*   credentials (not passed to QR code, but also not removed by whitelist filtering)

## Command-Line Tool

### Overview

```
RxOME.net QR Code generation tool

Usage: rxcode [options] [command]

Basic usage: rxcode g <input json file>: generates QR Code with the basefilename of the inputfile.
Before first use, please generate an API access key (rxcode -k) and deposit the public key 
on the RxOME server.


Options:
  -V, --version                         output the version number
  -h, --help                            display help for command

Commands:
  generate|g [options] [input file]     generate QR Code from PhenoPacket JSON
  convert|c [options] [input file]      convert case style of keys in JSON files from snake_case 
                                        to camelCase (and vice versa)
  preprocess|p [options] [input file]   perform preprocessing steps
  verify|v [input file]                 verify input file against phenopacket schema
  apikeys|k [options] [file prefix]     generate key pair for API access
  ping|P [options] <id> <key>           Ping API/check API credentials
  encode|e [options] [input file]       encrypt medical payload (just for testing)
  decode|d [options] [input file]       decode coded message
  pheno2proto|E [options] [input file]  encode PhenoPacket to protobuf (just for testing)
  proto2pheno|D [options] [input file]  decode protobuf to PhenoPacket (just for testing)
  statistics|s [input file]             print memory consuption for several stages and alternatives
  rxome-keys [options] [file prefix]    generate key pair for qr code data encryption 
                                        (just for testing)
  help [command]                        display help for command
```

### Generating QR codes

Use the 'g' command for actually generating a QR code:

```
RxOME.net QR Code generation tool

Usage: rxcode generate|g [options] [input file]

Generate QR Code from PhenoPacket JSON. The credential information keyId and either key or keyFile 
are mandatory and can be specified either in the input JSON file or by command line arguments.
The command line arguments precede the data from the JSON input file. 
Output: prints the given or new pseudonym.

Arguments:
  input file                Input JSON file (default: STDIN)

Options:
  -o, --output <filename>   Filename for the QR code (default: <inputfile>.png)
  -p, --pseudonym           Pseudonym for patient, if known. Otherwise a new is generated
  -i, --keyId <id>          API access ID (default: input file, credentials.keyId 
                            or metaData.createdBy)
  -k, --keyFile <filename>  Filename with API access key (default: use -s)
  -s, --key <key string>    API access key (default: input file, credentials.key)
  -u, --user <user string>  API access user (default: credentials.user 
                            or metaData.submittedBy or info@rxome.net)
  -c, --created <date>      Date (default: input file, metaData.created)
  -l, --lab <lab>           Laboratory name (default: input file, metaData.createdBy)
  -e, --email <email>       Laboratory email (default: input file, metaData.submittedBy)
  -S, --snake               Read payload formatted in snake_case (default: camelCase)
  -t, --test                Use test API instead of production API
  -D, --debug               Some output for debugging
  -h, --help                display help for command
```

Writes the pseudonym used to generate the QR code to STDOUT.

### Generating API Access Keys
To communicate with the server API you need access credentials, that is, an id for your lab (the keyId) and a pair of corresponding keys. First, generate a pair of keys with

```
rxcode k myLabId
```

This yields two files: `myLabId.private.apikey` and `myLabId.public.apikey`. Store the 
private key safely. 
Create a lab account on `www.rxome.net/lab` and upload the public key to your profile.
Afterwards, you should be able to access the API (see 'debugging' below).

## Demo

```
rxcode g -t -o qrcode.png demos/demo_data_full.json
```

<img src="qrcode.png" width="400">

## Debugging
To check the connection to the API on RxOME server API use

> `rxcode P -d ` *your_id* *your_key*

If you want to make sure that all data from your input is transmitted correctly, you can
use the `pheno2proto` and the corresponding `proto2pheno` commands to encode and decode your
file. Compare the output of `proto2pheno` with your original file:

```
rxcode E -b my_file.json > my_file.pbuf
rxcode D -bp my_file.pbuf > my_new_file.json
diff my_new_file.json my_file.json
```

## Payload Example File

```
{
  "id": "QR-Code ID",
  "comment": "useful remarks",
  "subject": {
    "id": "proband A",
    "dateOfBirth": "1994-01-01T00:00:00Z",
    "sex": "FEMALE"
  },
  "phenotypicFeatures": [
    {
      "type": {
        "id": "HP:0030084"
      }
    },
    {
      "type": {
        "id": "HP:0000555"
      }
    },
    {
      "type": {
        "id": "HP:0000486"
      }
    },
    {
      "type": {
        "id": "HP:0000541"
      }
    },
    {
      "type": {
        "id": "HP:0084369"
      }
    },
    {
      "type": {
        "id": "HP:0112358"
      }
    },
    {
      "type": {
        "id": "HP:0000145"
      }
    },
    {
      "type": {
        "id": "HP:1234567"
      }
    },
    {
      "type": {
        "id": "HP:9876543"
      }
    },
    {
      "type": {
        "id": "HP:5678912"
      }
    },
    {
      "type": {
        "id": "HP:0031360"
      },
      "excluded": true
    },
    {
      "type": {
        "id": "HP:0001234",
      },
      "excluded": true
    }
  ],
  "interpretations": [
    {
      "id": "interpretation.id",
      "progressStatus": "SOLVED",
      "diagnosis": {
        "disease": {
          "id": "OMIM:263750"
        },
        "genomicInterpretations": [
          {
            "variantInterpretation": {
              "acmgPathogenicityClassification": "PATHOGENIC",
              "variationDescriptor": {
                "geneContext": {
                  "valueId": "HGNC:9884",
                  "symbol": "RB1"
                },
                "expressions": [
                  {
                    "syntax": "hgvs.c",
                    "value": "NM_000321.2:c.958C>T"
                  }
                ],
                "allelicState": {
                  "id": "GENO:0000135"
                },
                "extensions": [
                  {
                    "name": "test-type",
                    "value": "Exome, short read"
                  }
                ]
              }
            }
          },
          {
            "variantInterpretation": {
              "acmgPathogenicityClassification": "LIKELY_PATHOGENIC",
              "variationDescriptor": {
                "geneContext": {
                  "valueId": "HGNC:9884",
                  "symbol": "RB1"
                },
                "expressions": [
                  {
                    "syntax": "hgvs.c",
                    "value": "NM_000321.2:c.1234A>G"
                  }
                ],
                "allelicState": {
                  "label": "heterozygous"
                },
                "extensions": [
                  {
                    "name": "test-type",
                    "value": "Exome, short read"
                  }
                ]
              }
            }
          }
        ]
      }
    }
  ],
  "metaData": {
    "created": "2021-05-14T10:35:00Z",
    "createdBy": "MGZ",
    "submittedBy": "abc@def.de",
    "phenopacketSchemaVersion": "2.0"
  }
}
```

<!--
## Acknowledgments
openpgp https://openpgpjs.org/
node-qrcode https://github.com/soldair/node-qrcode
noble-ed25519
-->