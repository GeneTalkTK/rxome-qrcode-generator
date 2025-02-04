# TODO:
* how to connect to docker container (shell)

# FindMe2care (RxOME) QR-code generator
Generates QR codes containing medical information for use with the FindMe2care platform
(formerly called RxOME).

## LICENSE

Copyright (c) 2023 RxOME GmbH

All rights reserved, unauthorized use prohibited.

## Purpose
The *rxome* packages generate QR codes from medical data for use with the FindMe2care platform.

The package *rxome-generator* offers a JavaScript library as well as
a command line tool as front end to this library. Additonally, the packages *rxome-server* and *rxome-server-win* 
provide a web service based on the rxome library. 

The packages expect the medical data in JSON format
according to a subset of the PhenoPacket standard (with some additions), see below. 
The medical data will be encrypted before generating the QR code. This encrypted data can be decrypted
by the database backend only. The meta data is transmitted unencrypted.

Every QR code is tagged with a unique pseudonym that is downloaded from the RxOME server. Thus, the tools
require an active internet connection. Furthermore, the user or the facility applying the QR generator has to sign up to the RxOME server. The communication to the server API is secured with a protocol that uses an
asymmetric pair of keys, a private key (the API access key) is used to sign the API enquiry,
a public key is uploaded to the server and used to verify the signature,
see generating user credentials.

When generating a QR code and, thus, downloading a pseudonym, the user needs to specify the
corresponding credentials (keyID and key) for accessing the FindMe2care server.
The command line tool offers command line options for the API access credentials. Further, they
can be specified in the input JSON file (see 'MetaData and credentials' below), 
where the command line options precede the data in the JSON file.

In case the patient already has a pseudonym that will be used for the QR code, 
the known pseudonym can be specified in the MetaData section of the input JSON data. 
Additionally, the command line tool
offers a command line argument, `-p`, for specifying a known pseudonym.
Note that this pseudonym must be a valid FindMe2care pseudonym, that is, it has to be generated by
FindMe2care for a previous medical statement. Using an arbitrary pseudonym will render the 
generated QR-Code useless, as it cannot be processed by FindMe2care.

By default, the keywords in the JSON file are expected to be noted in camelCase. However, the tool
can convert snake_case to camelCase (command line: -s, library function: convertToCamelCase).

## 1. Library and Command-Line Tool
### 1.1 Installation
> `npm install rxome-generator`

### 1.2 Basic Usage

#### Command Line Tool

Generate a QR code *inputfile*.png from a JSON file *inputfile*.json containing all medical data in PhenoPacket format, meta data and credentials (using camelCase for keywords):

> `rxcode g` *inputfile*.json

For detailed descriptions see 
> `rxcode g --help`

#### Library Functions
Import the library with
> `const Coder = require( 'rxome-generator' );`

The following two async library functions generate QR codes:
> `Coder.writeQR( filename, data, api = RXAPI )`

> *filename*: name for PNG file with the QR code<br/>
> *data*: object containing medical data, meta data, and credentials (format: see below)<br/>
> *api*: omit in production mode, set to `Coder.TESTAPI` in test mode.

This function creates the QR code from the given data and writes it as PNG file specified by *filename*. 
The credentials for accessing the RxOME API (i.e., fetching a pseudonym and the encryption key) have to be
part of the data object (see below). Returns the pseudonym used to generate the QR code and the unencrypted 
content of the QR code.

> `Coder.makeQR( data, api = RXAPI, apiEntry = APIENTRY )`

Generates a QR code object as Data URL that can be placed on a web page. As above, the credentials are specified as part of the data object. Returns an object:

```
{
    qr_code: (QR code),
    pseudonym: (pseudonym used to generate the QR code),
    qr_data: content of the QR code (with encrypted medical data; i.e., a 1:1 image of the QR code content),
    qr_content: content of the QR code but with unencrypted medical data for documentation purposes
}
```

Both `writeQR` and `makeQR` take care
of the preprocessing steps (sanitizing, compessing, encoding). However, converting the keys in the data object to camelCase is *not* part of the preprocessing. 
Use the following function to convert keys from snake_case to camelCase:

> `Coder.convertToCamelCase( data )`

Additionally, the data can be verified with

> `Coder.verify( data )`

Note that the credential information perhaps stored in the data package is *not* part of the PhenoPacket standard.

### 1.3 Command-Line Tool

#### Overview

```
FindMe2care QR Code generation tool

Usage: rxcode [options] [command]

Basic usage: rxcode g <input json file>: generates QR Code with the basefilename of the inputfile.
Before first use, please generate an API access key (rxcode -k) and deposit the public key on the 
FindMe2care server.


Options:
  -V, --version                         output the version number
  -h, --help                            display help for command

Commands:
  generate|g [options] [input file]     generate QR Code from PhenoPacket JSON
  upload|U [input file] [key ID] [key]  For debug purposes: Upload and decode QR Code PNG to server (only 
                                        for test server)
  convert|c [options] [input file]      convert case style of keys in JSON files from snake_case to 
                                        camelCase (and vice versa)
  preprocess|p [options] [input file]   perform preprocessing steps
  verify|v [input file]                 verify input file against phenopacket schema
  apikeys|k [options] [file prefix]     generate key pair for API access
  ping|P [options] <id> <key>           Ping API/check API credentials
  encrypt|e [options] [input file]      encrypt message (just for testing)
  decrypt|d [options] [input file]      decrypt coded message or medical data
  data-keys|K [options] [file prefix]   generate data encryption key pair (see -e, -d; just for testing)
  pheno2proto|E [options] [input file]  encode PhenoPacket to protobuf (just for testing)
  proto2pheno|D [options] [input file]  decode protobuf to PhenoPacket (just for testing)
  settings|S [options]                  Print current settings
  statistics|s [input file]             print memory consuption for several stages and alternatives
  help [command]                        display help for command

Author: Tom Kamphans, GeneTalk GmbH, 2022, (c) 2023 RxOME GmbH
```

#### Generating QR codes

Use the 'g' command for actually generating a QR code:

```
FindMe2care QR Code generation tool

Usage: rxcode generate|g [options] [input file]

Generate QR Code from PhenoPacket JSON. The credential information keyId and either key or keyFile 
are mandatory and can be specified either in the input JSON file or by command line arguments.
The command line arguments precede the data from the JSON input file. 
Output: prints the given or new pseudonym.

Arguments:
  input file                   Input JSON file (default: STDIN)

Options:
  -o, --output <filename>     Filename for the QR code (default: <inputfile>.png)
  -p, --pseudonym <pseudonym> For re-evaluations: pseudonym for patient. Otherwise a new is generated
                              (default: "")
  -i, --keyId <id>            API access ID (default: input file, credentials.keyId or metaData.createdBy)
  -k, --keyFile <filename>    Filename with API access key (default: use -s)
  -s, --key <key string>      API access key (default: input file, credentials.key)
  -u, --user <user string>    API access user (default: credentials.user or metaData.submittedBy or
                              info@rxome.net)
  -c, --created <date>        Date (default: input file, metaData.created)
  -l, --lab <lab>             Laboratory name (default: input file, metaData.createdBy or lab name stored
                              in the user account)
  -e, --email <email>         Laboratory email (default: input file, metaData.submittedBy)
  -S, --snake                 Read payload formatted in snake_case (default: camelCase)
  -t, --test                  Use test API instead of production API
  -L, --localhost             Connect to localhost API
  -D, --debug                 Some output for debugging
  -h, --help                  display help for command

Author: Tom Kamphans, GeneTalk GmbH, 2022, (c) 2023 RxOME GmbH
```

Writes the pseudonym used to generate the QR code to STDOUT. With -D given, this further writes the
(unencrypted) content of the QR code to STDOUT.

#### Generating API Access Keys
To communicate with the server API you need access credentials, that is, an id for your lab (the keyId) and a pair of corresponding keys. First, generate a pair of keys with

```
rxcode k myLabId
```

This yields two files: `myLabId.private.apikey` and `myLabId.public.apikey`. Store the 
private key safely. 
Create a lab account on `app.findme2care.de/generate` and upload the public key to your profile.
Afterwards, you should be able to access the API (see 'debugging' below).

#### Demo

```
rxcode g -t -o qrcode.png demos/demo_data_full.json
```

<img src="qrcode.png" width="400">

#### Testing your installation
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

Further, you can check a QR Code that was generated on the test server (using the `-t` option in `rxcode g `) by uploading and decoding it to the test server with the `upload` command:

```
rxcode U my_qr_code.png my_key_id my_private_key
```

## 2.  QR-code generator service
The packages *rxome-server* generates QR codes containing medical information for use with the FindMe2Care database
(formerly called RxOME). The command line tool `rxsrv` starts the QR generator as local service listening on localhost:*port* (default: port 1607).
A client can send POST requests to this port and retrieves the generated QR code by HTTP protocol.

A second package, *rxome-server-win*, build up on rxome-server installs the server as windows service.


### 2.1 Prerequisites
Running the QR-Code server requires either `node.js` or `docker`.

### 2.2 Using Node.js 

#### Installation
Either install the QR-Code Server or the Windows service installer using

```
npm install -q rxome-server 
```

or

```
npm install -q rxome-server-win
```


#### Starting the QR-Code Server

For detailed descriptions see 
```
rxsrv --help
```

#### Generating API access keys
You can generate new API access keys using the command line:
```
rxsrv --newkey
```

or in the Windows version: 
```
rxsrv_win.cmd command
```

or start the server with dummy FindMe2Care credentials and access the '/key' entrypoint of the server.

#### Configuring using Environment Variables

The following command starts the server and reads the configuration from environment variables. 
Note that the env variables can be set in the 
environment's config file, e.g. when using Docker or NGINX. Setting the port is optional.

```
export RXID=rxome
export RXKEY=private_key_for_rxome
export RXPORT=4242

rxsrv -e
```

Where `RXID` is the username of the laboratory on the FindMe2Care platform, `RXKEY` is the 
private API access key matching the public key stored on the lab's profile on the 
FindMe2Care platform. See the README of the rxome-qrcode-generator for generating the
API keys.

Note that storing secret information in environment variables may pose a security risk; therefore, this option is not recommended and should only be used if the software runs in an isolated environment.

#### Configuring using Config File

Example config file (setting the port is optional.)

```
cat demo.cfg
{
  "id": "rxome",
  "key": "private_key_for_rxome",
  "port": "4242"
}
```

Start the server and read settings from config file:

```
rxsrv -c demo.cfg
```


#### Registering and Unregistering the Windows Service
The npm package `rxome-server-win` provides a Windows executable that you can start with:

```
rxsrv_win.cmd command
```

where command is one of

- install
- uninstall
- ping
- newkey
- help 

Note that the Windows service is configured with a config file given by `%RXCFG%` or, if none specified, 
the default file `%APPDATA\npm\node_modules\rxome-server-win\demo.cfg` is used.

### 2.3 Using Docker
Instead of installing node.js and starting the server manually, you can use a docker image to run the service, e.g., with

```
docker run -d -p 1607:1607 tomkamphans/rxsrv:current -i "your_key_id" -s "your_private_key"
```

Also, you can specify key ID and key using environment variables, which may be useful in a docker compose or kubernetes setting: 

```
docker run -d -p 1607:1607 -e RXID=" your_key_id" -e RXKEY="your_private_key" tomkamphans/rxsrv:current
```

Where `your_key_id` is the lab's API user name and your_key is the private API key as described above.

When starting the first time (or when a new key pair should be used), you can start the service with

```
docker run -d -p 1607:1607 tomkamphans/rxsrv:current -i "your_key_id" -K
```

to generate a new key pair. Before starting the service, the script outputs the new keys. You should copy the public key into your FM2C profile, the private key 
is immediately used to run the service.

Note that the first port number in `-p 1607:1607` denotes the port on *localhost* to which the docker internal port (denoted the second port number, in this case 1607 also) is mapped. So if you need to run the service on another port, say 8081, use 
`docker run -p 8081:1607 ...`.

Hint for Docker on Windows: set the start type of *Docker Desktop Service* to *automatic* using the Windows Services App (services.msc).


### 2.4 API Endpoints

The server provides the following endpoints, see descriptions below:

* `GET /`
* `GET /demo`
* `POST /`
* `POST /img`
* `GET /key`

#### Testing connection

Querying the url `localhost:<port>/` should yield a line such as 

```This is the RxOME QRcode generator API Version 0.0.1 for lab id rxome running on port 1607 with PID 26584```

#### Getting Demo Data
For convenient testing, the server provides a demo JSON file by sending a GET request to `/data`.

#### Getting a QR-Code in PNG
Send a JSON file with the data for the RxOME code generator by POST request to `/img`, e.g.

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.png localhost:1607/img
```

#### Getting QR-Code and Pseudonym in JSON Format
In addition to the QR-Code itself, the code generator yields the pseudonym given to this patient
and the full unencrypted content of the QR code. The laboratory may
use this pseudonym if the patient is re-evaluated and gets a new QR-Code. Thus, the former medical data can be
overwritten in the FindMe2Care Database. To get the QR-code and the pseudonyme in JSON format, send the input JSON file to `/`:

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.json localhost:1607/
```

This yields a JSON response containing 

```
{
    qr_code: (QR code),
    pseudonym: (pseudonym used to generate the QR code),
    qr_content: content of the QR code but with unencrypted medical data for documentation purposes
}
```

### 2.5 Server Command-Line Tool

```
RxOME QR Code generation server

Usage: rxsrv usage: rxsrv -i <id> (-e | -c <cfg_file> | -k <key_file> | -s <key>) [-p <port>]

Start the QR-code tool as service listening on localhost:<port>.
Before first use, please generate an API access key with rxcode and deposit the public key on the
RxOME server.

The command-line parameters -k, -s, -p precede the environment variables (if -e specified), which, in
turn, precede the config file (if -c is also specified). A key string (-s) has precedence over a key
from a key file (-k).

Options:
  -c, --config <filename>   JSON file with config, entries id, key, [port]; -c-- to read from stdin
  -e, --environment         use environment variables RXID, RXKEY, RXPORT to configure rxsrv (useful
                            for working with docker)
  -i, --keyId <id>          API access ID
  -k, --keyFile <filename>  Filename with API access key (default: use -s)
  -s, --key <key string>    API access key
  -p, --port <port>         Set port for server, default: 1607
  -V, --version             output the version number
  -h, --help                display help
```




## 3. Data Format
### 3.1 Modifications to the PhenoPacket Standard
#### Meta Data and Credentials
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
the QR code will be generated using this pseudonym (this must be a valid/known RxOME
pseudonym, see introduction). Otherwise, a new one will be 
fetched from the server. In both cases, the
pseudonym used will be part of the output for futher processing or storing.

```
{
  ...
  metaData: {
    ...
     pseudonym: '19T5K7042' 
  }
  credentials: {
    keyId: <lab-id/key-id, corresponding to private key>
    key: <private key>
    keyFile: <name of file containing private key> // please specify key OR keyFile
    user: e.g., hans.motkamp@genetalk.de
  }
 
}
```

#### Phenotypic Features

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
     
#### Additional Data

The RxOME data format allows to store informations that are not provided by the phenopacket format by using
the phenopacket extension fields in the form

```
"extensions": [
                  {
                    "name": "...",
                    "value": "..."
                  },
                  {
                    "name": "...",
                    "value": "..."
                  }
              ]

```

*   The type of genetic test performed to obtain a variant (extension field name *test-type*)
*   CNV information (field name *cnv*). Possible values:
	*  0 = Not provided (default)
	*  1 = Deletion
	*  2 = Duplication

*   Methylation (field name *meth*). Possible values:
	* 0 = Not provided
	* 1 = Hypermethylation
	* 2 = Hypomethylation
	* 3 = Intermediate

* Allele Frequency (field name *af*)
* Repeat length (field name *rl*)
* Chromosomal Region (field name *chr*)
* Methylation site (field name *site*)

###### Example: test type

The type of genetic test performed to obtain a variant can be specified in an extension field to the genomic interpretation in the *variationDescriptor* section:

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
                "name": "test-type",
                "value": "Single gene sequencing"
              }
            ]
          }
        }
      }
    }
  ]
]
```

#### Additional Remarks

Additional remarks can be specified in a *comment* field on the top level:

```
{
  "id": "QR-Code ID",
  "comment": "useful remarks",
  "subject": {
...
```

#### Whitelist Filter

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

### 3.2 Special phenopacket entries
In this section, we give some additional explanations to some of the fields in the phenopacket schema.

#### Diagnosis/Disease
The diagnosis can be specified in the *disease* field. 
IMPORTANT: Note that the 

#### Zygosity
The zygosity is specified in the field *allelicState* in the *variationDescriptor* section. According to the
phenopacket standard, possible values are

* GENO\_0000137 for 'unspecified\_zygosity'
* GENO\_0000136 for 'homozygous'
* GENO\_0000135 for 'heterozygous'
* GENO\_0000402 for 'compound_heterozygous'
* GENO\_0000134 for 'hemizygous'
* GENO\_0000604 for 'hemizygous\_X\_linked'
* GENO\_0000605 for 'hemizygous\_Y\_linked'
* GENO\_0000606 for 'hemizygous\_insertion\_linked'
* GENO\_0000392 for 'aneusomic\_zygosity'
* GENO\_0000393 for 'trisomic\_homozygous'
* GENO\_0000394 for 'trisomic\_heterozygous'
* GENO\_0000602 for 'homoplasmic'
* GENO\_0000603 for 'heteroplasmic'
* GENO\_0000964 for 'mosaic'

### 3.3 Payload Example File

```
{
  "id": "232DTCEZZCQX",
  "subject": {
    "dateOfBirth": "2021-07-16",
    "sex": 1
  },
  "comment": "Demo record",
  "compressedFeatures": {
    "includes": [
      "HP:0003155",
      "HP:0001250",
      "HP:0001249"
    ],
    "excludes": [
      "HP:0031360"
    ]
  },
  "interpretations": [
    {
      "id": "first",
      "progressStatus": 3,
      "diagnosis": {
        "disease": {
          "id": "OMIM:614207"
        },
        "genomicInterpretations": [
          {
            "subjectOrBiosampleId": "0vlqzsw094u.0",
            "interpretationStatus": "3",
            "variantInterpretation": {
              "acmgPathogenicityClassification": "5",
              "variationDescriptor": {
                "geneContext": {
                  "valueId": "26031",
                  "symbol": "PIGV",
                  "alternateIds": [
                    "55650"
                  ]
                },
                "expressions": [
                  {
                    "syntax": "hgvs.c",
                    "value": "NM_017837.4(PIGV):c.1022C>A (p.Ala341Glu)"
                  }
                ],
                "extensions": [
                  {
                    "name": "test-type",
                    "value": "Single gene sequencing"
                  }
                ],
                "allelicState": {
                  "id": "GENO_0000136"
                }
              }
            }
          },
          {
            "subjectOrBiosampleId": "qpsczs5l7y.907m2ybforb",
            "variantInterpretation": {
              "acmgPathogenicityClassification": "1",
              "variationDescriptor": {
                "geneContext": {
                  "valueId": "31369",
                  "symbol": "TOMM5",
                  "alternateIds": [
                    "401505"
                  ]
                },
                "expressions": [
                  {
                    "syntax": "hgvs.c",
                    "value": "... hgvs code ..."
                  },
                  {
                    "syntax": "iscn",
                    "value": "... iscn data ..."
                  }
                ],
                "extensions": [
                  {
                    "name": "test-type",
                    "value": "Multigene panel"
                  },
                  {
                    "name": "cnv",
                    "value": "1"
                  },
                  {
                    "name": "meth",
                    "value": "1"
                  },
                  {
                    "name": "af",
                    "value": "...allele frequency..."
                  },
                  {
                    "name": "rl",
                    "value": "... repeat length ..."
                  },
                  {
                    "name": "chr",
                    "value": "... chromosomal region ..."
                  },
                  {
                    "name": "site",
                    "value": " ... methylation site ..."
                  }
                ],
                "allelicState": {
                  "id": "GENO_0000136"
                }
              }
            }
          },
          {
            "subjectOrBiosampleId": "qpsczs5l7y.k0z7yqgy8gi",
            "variantInterpretation": {
              "acmgPathogenicityClassification": "Unknown",
              "variationDescriptor": {
                "geneContext": {
                  "valueId": "34528",
                  "symbol": "TOMM6",
                  "alternateIds": [
                    "100188893"
                  ]
                },
                "expressions": [
                  {
                    "syntax": "hgvs.c",
                    "value": "HGVS2"
                  }
                ],
                "extensions": [
                  {
                    "name": "test-type",
                    "value": "Multigene panel"
                  }
                ],
                "allelicState": {
                  "id": "None"
                }
              }
            }
          }
        ]
      }
    }
  ],
  "metaData": {
    "created": "2024-08-13",
    "createdBy": "ACME Genetics",
    "submittedBy": "genetics@acme.org",
    "pseudonym": "232DTCEZZCQX"
  }
}
```

<!--
## Acknowledgments
openpgp https://openpgpjs.org/
node-qrcode https://github.com/soldair/node-qrcode
noble-ed25519
-->
