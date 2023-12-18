#!/usr/bin/env node

import * as FS from 'fs';
// const Coder = require( './lib/rxome-generator' );
import * as Coder from './lib/rxome-generator.cjs';
import * as ApiDemo from './lib/rxome-api-demo.cjs' ;
import * as RxAPI from './lib/rxome-api.cjs';

import { program } from 'commander';
import * as Path from 'path';
// import { cp } from 'fs/promises';

// const FS = require( 'fs' );
// const Coder = require( './lib/rxome-generator' );
// const ApiDemo = require( './lib/rxome-api-demo' );
// const RxAPI = require( './lib/rxome-api' );
// const { program } = require('commander');

// const Path = require('path');
// const { cp } = require('fs/promises');

//const TXT = require( './assets/scripts/modules/texte.js')

const DEMO_CREDENTIALS = ApiDemo.DEMO_CREDENTIALS
const DEMO_PRIVATE_KEY = ApiDemo.CRYPT_PRIVATE_KEY
const DEMO_PUBLIC_KEY = ApiDemo.CRYPT_PUBLIC_KEY

const VERSION = '1.0.0'

program
  .name('rxcode')
  .description(
`Basic usage: rxcode g <input json file>: generates QR Code with the basefilename of the inputfile.
Before first use, please generate an API access key (rxcode -k) and deposit the public key on the FindMe2care server.
`)
  .version( VERSION )
  .addHelpText('beforeAll', 'FindMe2care QR Code generation tool\n')
  .addHelpText('afterAll', '\nAuthor: Tom Kamphans, GeneTalk GmbH, 2022, (c) 2023 RxOME GmbH');


program.command('generate')
  .alias('g')
  .summary('generate QR Code from PhenoPacket JSON')
  .description(
`Generate QR Code from PhenoPacket JSON. The credential information keyId and either key or keyFile 
are mandatory and can be specified either in the input JSON file or by command line arguments.
The command line arguments precede the data from the JSON input file. 
Output: prints the given or new pseudonym.`)
  .argument('[input file]', 'Input JSON file (default: STDIN)')
  .option('-o, --output <filename>', 'Filename for the QR code (default: <inputfile>.png)')
  .option('-p, --pseudonym <pseudonym>', 'For re-evaluations: pseudonym for patient. Otherwise a new is generated', '')
  .option('-i, --keyId <id>', 'API access ID (default: input file, credentials.keyId or metaData.createdBy)')
  .option('-k, --keyFile <filename>', 'Filename with API access key (default: use -s)')
  .option('-s, --key <key string>', 'API access key (default: input file, credentials.key)')
  .option('-u, --user <user string>', 'API access user (default: credentials.user or metaData.submittedBy or info@rxome.net)')
  .option('-c, --created <date>', 'Date (default: input file, metaData.created)')
  .option('-l, --lab <lab>', 'Laboratory name (default: input file, metaData.createdBy or lab name stored in the user account)')
  .option('-e, --email <email>', 'Laboratory email (default: input file, metaData.submittedBy)')
  .option('-S, --snake', 'Read payload formatted in snake_case (default: camelCase)')
  .option('-t, --test', 'Use test API instead of production API')
  .option('-L, --localhost', 'Connect to localhost API')
  .option('-D, --debug', 'Some output for debugging')
  .action( async (inputfile, options) => {
    const rawdata = FS.readFileSync( inputfile || '/dev/stdin' );
    const jsonData = JSON.parse( rawdata ); 
    const qrData  = options.snake ? Coder.convertToCamelCase( jsonData ) : jsonData;
  
    ('metaData' in qrData) || (qrData.metaData = {});
    options.lab       && (qrData.metaData.createdBy    = options.lab);
    options.created   && (qrData.metaData.created      = options.created);
    options.email     && (qrData.metaData.submittedBy  = options.email);
    options.pseudonym && (qrData.metaData.pseudonym    = options.pseudonym);
    let qrApi = RxAPI.API;
    options.test && (qrApi = RxAPI.TESTAPI);
    options.localhost && (qrApi = 'http://localhost:3000/');
  
    ('credentials' in qrData) || (qrData.credentials = {});
    if ( options.key ) {
      qrData.credentials.key = options.key;
      delete qrData.credentials.keyFile;
    } else if ( options.keyFile ){
      qrData.credentials.keyFile = options.keyFile;
      delete qrData.credentials.key;
    }
    qrData.credentials.keyId = options.keyId || qrData.credentials.keyId || qrData.metaData.createdBy
    qrData.credentials.user  = options.user  || qrData.credentials.user  || qrData.metaData.submittedBy || 'info@rxome.net';

    if (! (qrData.credentials.keyId )) {
      console.log( 'Error: no API ID.');
      return 1;
    }
    if (! (qrData.credentials.keyFile || qrData.credentials.key)) {
      console.log( 'Error: no API access key.');
      return 1;
    }

    // options.debug && console.log( "Data ", qrData );
  
    const outputfile = options.output || `${Path.basename((inputfile || 'qrcode.json'), '.json')}.png`
    const data = await Coder.writeQR( outputfile, qrData, qrApi );
    console.log( data.pseudonym );
    options.debug && console.log( JSON.stringify( data.qr_content, 0, 2) );
  });
  

program.command('convert')
  .alias('c')
  .description('convert case style of keys in JSON files from snake_case to camelCase (and vice versa)')
  .argument('[input file]', 'Input JSON file (default: STDIN)')
  .option('-o, --output <output file>', 'Output JSON file (default: stdout)')
  .option('-s, --snake', 'Convert to snake_case (default: convert to camelCase')
  .action( async (inputfile, options) => {
    const data = JSON.parse(FS.readFileSync( inputfile || '/dev/stdin' ));
    let newData;
    if ( options.snake ) {
      newData = Coder.convert_to_snake_case( data );
    } else {
      newData = Coder.convertToCamelCase( data );
    }
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( JSON.stringify( newData ) );
  });


program.command('preprocess')
  .alias('p')
  .description('perform preprocessing steps')
  .argument('[input file]', 'Input JSON file (default: STDIN)')
  .option('-o, --output <output file>', 'Output JSON file (default: stdout)')
  .option('-C, --case', 'Apply case style converter from snake_case to camelCase')
  .option('-w, --whitelist', 'Apply whitelist filtering (remove unnecessary sections)')
  .option('-s, --sanitize', 'Apply sanitizing step (remove common mistakes)')
  .option('-c, --compress', 'Compact HPO term list')
  .action( async (inputfile, options) => {
    let data = JSON.parse(FS.readFileSync( inputfile || '/dev/stdin' ));
    options.case && (data = Coder.convertToCamelCase( data ));
    options.whitelist && (data = Coder.whiteListPhenoPacket( data ));
    options.sanitize && (data = Coder.sanitizePhenoPacket( data ));
    options.compress && (data = Coder.compressPhenoPacket( data ));
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( JSON.stringify( data ) );
  })
  
  
program.command('verify')
  .alias('v')
  .description('verify input file against phenopacket schema')
  .argument('[input file]', 'Input JSON file (default: STDIN)')
  .action( async (inputfile) => {
    let data = JSON.parse(FS.readFileSync( inputfile || '/dev/stdin' ));
    let result = await Coder.verifyPhenoPacket( data );
    console.log( result || 'No error found' );
  })


program.command('apikeys')
  .summary('generate key pair for API access')
  .alias('k')
  .description('Generate key pair. A pair of these keys is necessary to communicate with the FindMe2care API. Keep the private key and deposit the public key on the FindMe2care server.')
  .argument('[file prefix]', 'Prefix for file names (default: rxome)')
  .option('-d, --directory <dir>', 'output directory', '.')
  .action( (prefix, options) => {
    RxAPI.generateApiKeys( prefix || 'rxome', options.directory )
  });


program.command('ping')
  .summary('Ping API/check API credentials')
  .alias('P')
  .argument('id', 'API access key ID')
  .argument('key', 'API access key')
  .option('-t, --test', 'Connect to test API')
  .option('-L, --localhost', 'Connect to localhost API')
  .option('-D, --debug', 'Some output for debugging')
  .action( async (id, key, options) => {
    let qrApi = RxAPI.API;
    options.test && (qrApi = RxAPI.TESTAPI);
    options.localhost && (qrApi = 'http://localhost:3000/');
    const credentials = {
      keyId: id || 'rxome',
      key: key,
      user: 'info@rxome.net'
    }
    options.debug && console.log( "Sending " , credentials , " to ", qrApi );

    Coder.fetchKey( credentials, 'HANSMOTKAMP', qrApi, options.debug )
    .then( result => { console.log('[RESULT] ', result);console.log( (result?.key && result?.pseudonym === 'HANSMOTKAMP') ? 'OK' : 'An error occured')} )
    .catch( error => {
      console.log( '[Error] ', error.code );
      if (error.response) {  // status !== 2xx
        // options.debug && console.log('\nResp. Data:\n', error.response.data);
        options.debug && console.log('\nResp. Headers:\n', error.response.headers);
        console.log('\nError ', error.response.status);
      } else if (error.request) { // request send, but no response
        options.debug && console.log('\nError client-request:\n', error.request);
      } else { // request could not be send
        options.debug && console.log('Error', error.message);
      }
    });
  });


program.command('encrypt')
  .alias('e')
  .description('encrypt message (just for testing)')
  .argument('[input file]', 'Input text file (default: STDIN)')
  .option('-o, --output <output file>', 'Output file (default: stdout)')
  .option('-k, --keyfile <keyfile>', 'name of public data encryption key file (not to be confused with the API access key!)', 'rxome.public.key')
  .option('-j, --json', 'treat inputfile as json {key: ..., message: ...}', false)
  .action( async (inputfile, options) => {
    const data = FS.readFileSync( inputfile || '/dev/stdin' );
    let message;
    let key;
    if ( options.json ) {
      const dataJ = JSON.parse( data );
      key = dataJ.key;
      message =  dataJ.message;
    } else {
      key = FS.readFileSync( options.keyfile ).toString();
      message = data.toString();
    }
    const cipher = await Coder.encode( key, message );
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( cipher );
  });


program.command('decrypt')
  .alias('d')
  .description('decrypt coded message or medical data')
  .argument('[input file]', 'Input cipher file (default: STDIN)')
  .option('-o, --output <output file>', 'Output file (default: stdout)')
  .option('-k, --keyfile <keyfile>', 'name of private data encryption key file', 'rxome.private.key')
  .option('-j, --json', 'treat inputfile as json {key: ..., cipher: ...}', false)
  .option('-c, --complete', 'also unpack PhenoPacket', false )
  .option('-d, --debug', 'Output some debug data', false )
  .action( async (inputfile, options) => {
    const input = FS.readFileSync( inputfile || '/dev/stdin' );
    let key;
    let cipher;
    if ( options.json ) {
      const inputJ = JSON.parse( input );
      cipher = inputJ.cipher;
      key = inputJ.key;
    } else {
      cipher = input;
      key = FS.readFileSync( options.keyfile ).toString();
    }

    const data = await Coder.decode( key, cipher.toString() );

    let result;
    if ( options.complete ){
      const clearBufferB64 = await Coder.decode( key, cipher.toString() );
      options.debug && console.error( "buffer:", clearBufferB64 )
      const clearB64 = RxAPI.base64ToBuffer(data);
      options.debug && console.error( "clear ", clearB64 )
      const phenoPrimeB64 = Coder.decodePhenoPacket(clearB64);
      result = JSON.stringify(phenoPrimeB64);
    } else {
      result = data;
    }
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( result );
  });


program.command('data-keys')
  .alias('K')
  .description('generate key pair for data encryption (see -e, -d; just for testing)')
  .argument('[file prefix]', 'Prefix for file names (default: rxome)')
  .option('-d, --directory <dir>', 'output directory', '.')
  .action( (prefix, options) => {
    Coder.generateRxomeKeyFiles( prefix || 'rxome', options.directory )
});


program.command('pheno2proto')
  .alias('E')
  .description('encode PhenoPacket to protobuf (just for testing)')
  .argument('[input file]', 'Input text file (default: STDIN)')
  .option('-o, --output <output file>', 'Output file (default: stdout)')
  .option('-b, --base64', 'Write output base64 encoded')
  .option('-W, --whitelist', 'Preprocess: whitelist', false )
  .option('-S, --sanitize', 'Preprocess: sanitize', false )
  .option('-C, --compress', 'Preprocess: compress', false )
  .action( async (inputfile, options) => {
    //const { metaData, credentials, ...medical } = JSON.parse( FS.readFileSync( inputfile || '/dev/stdin' ));
    const medical = JSON.parse( FS.readFileSync( inputfile || '/dev/stdin' ));
    const whiteListMedical = options.sanitize ? Coder.whiteListPhenoPacket( medical ) : medical;
    const sanitizedMedical = options.sanitize ? Coder.sanitizePhenoPacket( whiteListMedical ) : whiteListMedical;
    const compressedMedical = options.compress ? Coder.compressPhenoPacket( sanitizedMedical ) : sanitizedMedical;
    const protobufMedical = Coder.encodePhenoPacket( compressedMedical );
    const outData = (options.base64 ? RxAPI.bufferToBase64( protobufMedical ) : protobufMedical );
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( outData );
  });


program.command('proto2pheno')
  .alias('D')
  .description('decode protobuf to PhenoPacket (just for testing)')
  .argument('[input file]', 'Input cipher file (default: STDIN)')
  .option('-o, --output <output file>', 'Output file (default: stdout)')
  .option('-b, --base64', 'Read input base64 encoded')
  .option('-p, --pretty', 'Pretty print output}')

  .action( async (inputfile, options) => {
    const input = FS.readFileSync( inputfile || '/dev/stdin' );
    const data = ( options.base64 ? Uint8Array.from([...atob(input) ].map( c => c.charCodeAt(0))): input)
    const pheno = Coder.decodePhenoPacket(data);
    if ( options.output ) {
      const stream = FS.createWriteStream( options.output );
      process.stdout.write = stream.write.bind( stream );
    }
    process.stdout.write( JSON.stringify(pheno, ' ', options.pretty ? 2 : 0) );
  });


program.command('settings')
  .alias('S')
  .description('Print current settings')
  .option('-t, --test', 'Connect to test API')
  .action( (options) => {

    console.log('This RxOME/FindMe2care QR generator V', VERSION );
    console.log('Connecting to', options.test ? RxAPI.TESTAPI : RxAPI.API );
    console.log('API', options.test ? RxAPI.APIENTRY : RxAPI.APIENTRY );

});

program.command('statistics')
.alias('s')
.argument('[input file]', 'Input JSON file (default: ./demos/demo_data_full.json)')
.description('print memory consuption for several stages and alternatives')
.action( async (inputfile, options) =>{
  const fileName = inputfile || './demos/demo_data_full.json';
  const data = JSON.parse( FS.readFileSync( fileName ));
  const { metaData, credentials, ...medical } = data;

  console.log( "Full      : ", JSON.stringify(data).length );
  console.log( "Medical   : ", JSON.stringify(medical).length );
  const whiteListMedical = Coder.whiteListPhenoPacket( medical );
  console.log( "Whitelist : ", JSON.stringify(whiteListMedical).length );
  const sanitizedMedical = Coder.sanitizePhenoPacket( whiteListMedical );
  console.log( "Sanitized : ", JSON.stringify(sanitizedMedical).length );
  const compressedMedical = Coder.compressPhenoPacket( sanitizedMedical );
  console.log( "Compressed: ", JSON.stringify(compressedMedical).length );
  //console.log( JSON.stringify(compressedMedical));
  const protobufMedical = Coder.encodePhenoPacket( compressedMedical );
  console.log( "Protobuf  : ", protobufMedical.length );
  //console.log( "Protobuf  : ", protobufMedical );
  //console.log( "Protobuf  : ", protobufMedical.constructor.name );
  // console.log( "- Hex     : ", protobufMedical.toString('hex').length );;
  //console.log( "- Utf8    : ", protobufMedical.toString('utf8').length )

  console.log("===================================================================");
  console.log("ProtoBuf, Encrypted:") 
  const cipherBin = await Coder.encode( DEMO_PUBLIC_KEY , protobufMedical, true);
  console.log( "Cipher       : ", cipherBin.length );
  console.log( " - toString  : " , cipherBin.toString().length );
  // const clearBufferBin = await Coder.decode( DEMO_PRIVATE_KEY, '', cipherBin, true );
  // const clearBin = Buffer.from (clearBufferBin, 'Binary');
  // console.log( "Decrypted PhenoPacket: " , clearBin.length );
  // const phenoPrimeBin = Coder.decodePhenoPacket(clearBin);
  // const phenoBin = JSON.parse(JSON.stringify(phenoPrimeBin));
  // console.log( "Original Data:  : ", JSON.stringify(phenoBin).length );

  console.log("===================================================================");
  console.log("ProtoBuf, BASE64 Encoded, Encrypted:")
  const protobufMedicalBase64 = RxAPI.bufferToBase64( protobufMedical );
  console.log( "Base64  : ", protobufMedicalBase64.length );
  const cipherB64 = await Coder.encode( DEMO_PUBLIC_KEY, protobufMedicalBase64 );
  console.log( "Cipher Base64: ", cipherB64.length );
  console.log( " - toString  : ", cipherB64.toString().length );
  //console.log(" B64 ", cipherB64 )
  const clearBufferB64 = await Coder.decode( DEMO_PRIVATE_KEY, cipherB64 );
  //console.log( "buffer:", clearBufferB64 )
  //const clearB64_2 = Buffer.from (clearBufferB64, 'base64');
  const clearB64 = RxAPI.base64ToBuffer( clearBufferB64 );
  console.log( "Decrypted PhenoPacket: " , clearB64.length );
  const phenoPrimeB64 = Coder.decodePhenoPacket(clearB64);
  const phenoB64 = JSON.parse(JSON.stringify(phenoPrimeB64));
  console.log( "Original Data: ", JSON.stringify(phenoB64).length );
  //console.log( JSON.stringify(phenoB64, ' ', 2) );

  // qrData = {
  //   keyver: "key.version",
  //   apiver: "apiVer",
  //   pseudonym: "key.pseudonym",
  //   payload: cipherBin.toString()
  // }
  // console.log( "QR-Data: ", JSON.stringify( qrData ).length )
  //const { pseudonym, qr_content } = await Coder.writeQR( "stat.png", qrData, RxAPI.TESTAPI );
  

  console.log("===================================================================");
  console.log("Without ProtoBuf, Encrypted:")
  const cryptCompressed = await Coder.encode( DEMO_PUBLIC_KEY , JSON.stringify( compressedMedical ) );
  console.log( "Cipher: ", cryptCompressed.length );
  console.log( " - toString  : " , cryptCompressed.toString().length )

});


// program.command('run')
// .argument('[input file]', 'Input JSON file (default: ./demos/demo_data_full.json)')
// .action( async (inputfile, options) =>{
//   // const fileName = options.input || './demos/demo_data_full.json';
//   // //file = inputfile || '/dev/stdin'
//   // const data = JSON.parse( FS.readFileSync( fileName ));
//   // // const { pseudonym, qr_content } = await Coder.writeQR( "ZZZtest.png", data, RxAPI.TESTAPI );
//   // console.log( data );
//   // console.log( Coder.whiteListPhenoPacket( data ) );
//   // console.log( {
//   //   ...data.subject
//   // })
//   const resp = await Coder.fetchKey( DEMO_CREDENTIALS, 'foo', RxAPI.TESTAPI )
//   console.log( resp );

// data = { name: 'foobar', number: 42, ping: 'fiedeldiedel'}
// const message = JSON.stringify(data)
// const { privateKey, publicKey } = await Coder.generateRxomeKeys( )
// Coder.encode(publicKey, message)
//   .then(cipher => {
//     console.log( cipher )
//     return Coder.decode(privateKey, cipher)
//   })
//   .then(clear => {console.log( JSON.parse(clear) )})
// .action( async() => {
//   console.log( JSON.stringify( await Coder.fetchDemoPrivateKey( DEMO_CREDENTIALS, '', RxAPI.TESTAPI, true )));

// });


program.parse();
  
