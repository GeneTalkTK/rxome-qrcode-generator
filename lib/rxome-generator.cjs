// https://openpgpjs.org/
const PGP = require( 'openpgp' );

// https://github.com/soldair/node-qrcode
const QRCode = require( 'qrcode' );

const jsonKeyConverter = require('json-key-converter');
const Protobuf = require('protobufjs');
const PhenoPacketDescriptor = require("./phenopackets.json");

//const { constants } = require('buffer');

const RxAPI= require('./rxome-api.cjs');

const apiVer = '1.0';
const RXAPI = RxAPI.API;
const RXTESTAPI = RxAPI.TESTAPI;
const APIENTRY = RxAPI.APIENTRY;

const PASSPHRASE = 'n0thin6r3@11ym@773r5';

// const ProtoBufRoot = await Protobuf.load('assets/scripts/modules/phenopackets/schema/v2/phenopackets.proto');
const ProtoBufRoot = Protobuf.Root.fromJSON( PhenoPacketDescriptor );
const PhenoPacket = ProtoBufRoot.lookupType('org.phenopackets.schema.v2.Phenopacket')

const ENUM_SEX = ['UNKNOWN', 'FEMALE', 'MALE', 'OTHER']
exports.ENUM_SEX = ENUM_SEX;

const ENUM_PROG_STATE = ['UNKNOWN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'SOLVED', 'UNSOLVED']
exports.ENUM_PROG_STATE = ENUM_PROG_STATE;

const ENUM_ACMG = 
  ['NOT_PROVIDED', 'BENIGN', 'LIKELY_BENIGN', 'UNCERTAIN_SIGNIFICANCE', 'LIKELY_PATHOGENIC', 'PATHOGENIC'];

exports.ENUM_ACMG = ENUM_ACMG;


/************************************************************************************
 * Functions for node.js only
 ************************************************************************************/

try {
  const FS = require( 'fs/promises' );
  const { version } = require('os');
  
  exports.generateRxomeKeyFiles = async (name = 'rxome', dir = '.') => {
    const { privateKey, publicKey } = await exports.generateRxomeKeys( name );
    await Promise.all([
      FS.writeFile(`${dir}/${name}.private.key`, privateKey, { mode: 0o600 }, err => { console.log(err); }),
      FS.writeFile(`${dir}/${name}.public.key`, publicKey, { mode: 0o600 }, function (err) { console.log(err); })
    ]);
  }
 
  exports.writeQR = async ( filename, data, api = RXAPI, apiEntry = APIENTRY ) => {
    const {qrData, pseudonym} = await exports.prepareQR( data, api, apiEntry );
    //const base64Data = qr_code.replace(/^data:image\/png;base64,/, "");
    //FS.writeFile(filename, base64Data, 'base64', (err) => {console.log(err)} );
    QRCode.toFile( filename, JSON.stringify( qrData ), { type: 'png'} )
    return pseudonym
  }
}

catch (e) {
  if (e instanceof Error && e.code !== "MODULE_NOT_FOUND") {
    throw e;
  }
}

/************************************************************************************/


exports.generateRxomeKeys = async (name = 'rxome') => {
  return { privateKey, publicKey, revocationCertificate } = await PGP.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    //type: 'rsa',
    //rsaBits: 2048,
    userIDs: [{ name: name, email: 'info@rxome.net' }],
    passphrase: PASSPHRASE,
    format: 'armored'
  });
}


exports.fetchKey = async ( credentials, pseudonym = '', api = RXAPI, debug = false, apiEntry = APIENTRY ) => {
  const result = await RxAPI.fetchData( `${api}/${apiEntry}/getpseudonym`, credentials, pseudonym, debug )
  if ( !result.pseudonym )
    result.pseudonym = pseudonym;
  return result;
}
/* 
  yields: { key: PGP_key, version: ..., pseudonym: ... }
*/
 
 
exports.fetchDemoPrivateKey = async ( credentials, api=RXTESTAPI, debug = false, apiEntry = APIENTRY ) => 
  await RxAPI.fetchData( `${api}/${apiEntry}/getprivatedemokey`, credentials, '', debug )

/* 
   yields: { private_key: PGP_key } 
*/

exports.fetchRxomeKey = async ( credentials, api = RXAPI, debug = false, apiEntry = APIENTRY ) => 
  await RxAPI.fetchData( `${api}/${apiEntry}/getrxomekey`, credentials, '', debug )

/* 
   yields: { key: PGP_key, version: ... } 
*/
exports.convert_to_snake_case = data => jsonKeyConverter.convert( data, { camel: false } );

exports.convertToCamelCase = data => jsonKeyConverter.convert( data, { camel: true } );

exports.compressPhenoPacket = ( data ) => {
  const compressedData = {
    ...data,
  };  
  if ( data.phenotypicFeatures ) {
    compressedData.compressedFeatures = {
      includes: data.phenotypicFeatures.filter( feat => feat.excluded === undefined  || feat.excluded === false || feat.excluded === 'false' ).map( feat => feat.type.id ),
      excludes: data.phenotypicFeatures.filter( feat => feat.excluded === true || feat.excluded === 'true' ).map( feat => feat.type.id )
    }
  }
  delete compressedData.phenotypicFeatures;
  return compressedData;
}


exports.sanitizeSex = ( str ) =>
  isNaN(+(str.toString()))
  ? Math.max(0, ENUM_SEX.indexOf(str.toUpperCase().replace('_SEX', '')))
  : +str;


exports.sanitizeProgState = ( str ) =>
  isNaN(+(str.toString()))
  ? Math.max(0, ENUM_PROG_STATE.indexOf(str.toUpperCase()))
  : +str;


exports.sanitizeACMG = ( str ) =>
  isNaN(+(str.toString()))
  ? Math.max(0, ENUM_ACMG.indexOf(str.toUpperCase()))
  : +str


exports.whiteListPhenoPacket = ( data ) => {
  res = {};
  data.id  && (res.id = data.id);
  data.comment  && (res.comment = data.comment);
  data.subject  && (res.subject = data.subject);
  data.phenotypicFeatures  && (res.phenotypicFeatures = data.phenotypicFeatures);
  data.compressedFeatures  && (res.compressedFeatures = data.compressedFeatures);
  data.interpretations  && (res.interpretations = data.interpretations);
  data.diagnosis  && (res.diagnosis = data.diagnosis);
  data.metaData && (res.metaData = data.metaData);
  data.credentials && (res.credentials = data.credentials);
  return res;
}


exports.sanitizePhenoPacket = ( data, key = '' ) => {
  if ( data instanceof Object ) {
    if (Array.isArray( data )) {
      return data.map( x => exports.sanitizePhenoPacket(x));
    } else {
      let obj={};
      for ( let k in data ) { 
        obj[k] = exports.sanitizePhenoPacket( data[k], k );
      }
      return obj;
    }
  } else {
    switch( key ){
      case 'sex':
        return exports.sanitizeSex( data );
      case 'progressStatus':
        return exports.sanitizeProgState( data );
      case 'acmgPathogenicityClassification':
        return exports.sanitizeACMG( data );
      default: 
        return data;
    }
  }
}


exports.verifyPhenoPacket = (data) => (
  PhenoPacket.verify( data )
)


exports.encodePhenoPacket = (data) => (
  PhenoPacket.encode( data ).finish()
)


exports.decodePhenoPacket = (data) => (
  PhenoPacket.decode( data )
)


exports.encode_serial = async (publicKeyStr, message) => {
  const publicKey = await PGP.readKey({ armoredKey: publicKeyStr });
  const encrypted = await PGP.encrypt({
    message: await PGP.createMessage({ text: message }),
    encryptionKeys: publicKey,
    //format: 'binary',
    //signingKeys: privateKey
  });
  return encrypted;
}


exports.encode = async (publicKeyStr, message, binary = false) => {
  return await Promise.all([
    PGP.readKey({ armoredKey: publicKeyStr }),
    PGP.createMessage( (binary 
                        ? { binary: message, format: 'binary' }
                        : { text: message }) )
  ]).then( async ([publicKey, message]) => {
    const encrypted = await PGP.encrypt({
      message: message,
      encryptionKeys: publicKey,
      format: (binary ? 'binary' : 'armored'),
      //        signingKeys: privateKey
    });
    return encrypted;
  }
  )
}


exports.decode_serial = async (privateKeyStr, encrypted) => {
  const privateKey = await PGP.readPrivateKey( { armoredKey: privateKeyStr } );
  const privateKeyDecr = await PGP.decryptKey({
    privateKey: privateKey,
    passphrase: PASSPHRASE
  });
  const message = await PGP.readMessage({
    armoredMessage: encrypted
  });
  const { data: decrypted, signatures } = await PGP.decrypt({
    message,
    decryptionKeys: privateKeyDecr
  });
  return decrypted;
}


exports.decode = async (privateKeyStr, encrypted, binary = false) => {
  return await Promise.all([
    PGP.readPrivateKey({ armoredKey: privateKeyStr })
    .then( (privateKey) => {
      return PGP.decryptKey({
        privateKey: privateKey,
        passphrase: PASSPHRASE 
      })
    }),
    PGP.readMessage( (binary 
                      ? {binaryMessage: encrypted}
                      : {armoredMessage: encrypted} )
    )
  ]).then( async ([ privateKeyDecr, message]) => {
    const { data: decrypted, signatures } = await PGP.decrypt({
      message,
      //verificationKeys: publicKey, // optional
      decryptionKeys: privateKeyDecr,
      format: (binary ? 'binary' : 'utf8')
    });
    // check signature validity (signed messages only)
    //      try {
    //        await signatures[0].verified; // throws on invalid signature
    //        console.log('Signature is valid');
    //      } catch (e) {
    //        throw new Error('Signature could not be verified: ' + e.message);
    //      }
    return decrypted;
  })
}


exports.prepareQR = async ( data, api = RXAPI, apiEntry = APIENTRY ) => {
  const { metaData, credentials, ...medical } = data;

  const whiteListMedical  = exports.whiteListPhenoPacket( medical );
  const sanitizedMedical  = exports.sanitizePhenoPacket( whiteListMedical );
  const compressedMedical = exports.compressPhenoPacket( sanitizedMedical );
  const protobufMedical   = exports.encodePhenoPacket( compressedMedical );
  const base64Medical     = RxAPI.bufferToBase64(protobufMedical);

  const key = await this.fetchKey( credentials, metaData.pseudonym || '', api, false, apiEntry );

  // check:
  //const buff = RxAPI.base64ToBuffer( base64Medical );
  //const pheno = exports.decodePhenoPacket( buff );
  //const medicalDeciphered = JSON.parse( JSON.stringify( pheno ));
  //console.log( JSON.stringify(medicalDeciphered,' ', 2 ))

  const cipher = await exports.encode( key.key, base64Medical );

  //delete metaData.pseudonym;
  const newMetaData = Object.fromEntries( 
    Object.entries( metaData ).filter( ([key, val]) => key !== 'pseudonym')
  )

  const qrData = {
    createdBy: key.lab,
    ...newMetaData,
    labid: key.lab_id,
    keyver: key.version,
    apiver: apiVer,
    pseudonym: key.pseudonym,
    payload: cipher.toString()
  }
  console.log( "[QR Generator lib ]", qrData, "\nLength: ", JSON.stringify( qrData ).length  );

  return {
    qrData: qrData,
    pseudonym: key.pseudonym
  }
}


exports.makeQR = async ( data, api = RXAPI, apiEntry = APIENTRY ) => {
  const {qrData, pseudonym} = await exports.prepareQR( data, api, apiEntry );
  return {
    qr_code: await QRCode.toDataURL( JSON.stringify( qrData )),
    pseudonym: pseudonym,
    qr_data: qrData
  }
}

exports.versionStr = () => {
  return 'RxOME QR Generator 1.0.0, 2022 Tom Kamphans, GeneTalk GmbH'
}


// convert .proto to .json:
// cd assets/scripts/modules/phenopackets/schema/v2
// ../../../../../../node_modules/protobufjs-cli/bin/pbjs -t json phenopackets.proto > phenopackets.json

//decode:
  // /////
  // const clearBufferBin = await Coder.decode(PRIVATE_KEY, '', cipherBin, true );
  // const clearBin = Buffer.from (clearBufferBin, 'Binary');
  // const phenoPrimeBin = Coder.decodePhenoPacket(clearBin);
  // const phenoBin = JSON.parse(JSON.stringify(phenoPrimeBin));
  // //// 

