const PGP = require( 'openpgp' );
const QRCode = require( 'qrcode' );
const Axios = require( 'axios' );

const RXAPI = 'https://api.rxome.net';
const RXTESTAPI = 'https://testapi.gene-talk.de';
const apiVer = '1.0';
exports.RXAPI = RXAPI;
exports.RXTESTAPI = RXTESTAPI;

const PASSPHRASE = 'n0thin6r3@11ym@773r5';

try {
  const FS = require( 'fs/promises' );
  const { version } = require('os');

  exports.generateKeys = async(name, email, dir = '.') => {
    const { privateKey, publicKey, revocationCertificate } = await PGP.generateKey({
      type: 'ecc', // Type of the key
      curve: 'curve25519', // ECC curve name
      userIDs: [{ name: name, email: email }],
      passphrase: PASSPHRASE + name,
      format: 'armored'
    });
    FS.writeFile(`${dir}/${name}.private.key`, privateKey, { mode: 0o600 }, err => { console.log(err); });
    FS.writeFile(`${dir}/${name}.public.key`, publicKey, { mode: 0o600 }, function (err) { console.log(err); });
  }

  exports.writeQR = async( filename, data, api = RXAPI, apiEntry = 'rxkey' ) => {
    const {qr_code, pseudonym_lab} = await exports.makeQR( data, api, apiEntry );
    const base64Data = qr_code.replace(/^data:image\/png;base64,/, "");
    FS.writeFile(filename, base64Data, 'base64', (err) => {console.log(err)} );
    return pseudonym_lab
  }
}
catch (e) {
  if (e instanceof Error && e.code !== "MODULE_NOT_FOUND") {
      throw e;
  }
}

exports.fetchKey = ( pseudonym_lab = '', api = RXAPI, apiEntry = 'rxkey' ) => {
  const options = {
    timeout: 5000
  }
  return Axios
          .get( `${api}/${apiEntry}/?pslab=${pseudonym_lab}`, options )
          .then(res => {
            return res.data
          })
}
/* 
   yields: { key: PGP_key, version: ..., pseudonym: ..., pseudonym_lab: ...}
*/


exports.fetchDemoPrivateKey = () => {
  const options = {
    timeout: 5000
  }
  return Axios
          .get( `${RXTESTAPI}/rxprivatekey`, options )
          .then(res => {
            return res.data
          })
}
/* 
   yields: { private_key: PGP_key } 
*/


exports.encode_serial = async(publicKeyStr, message) => {
  const publicKey = await PGP.readKey({ armoredKey: publicKeyStr });
  const encrypted = await PGP.encrypt({
    message: await PGP.createMessage({ text: message }),
    encryptionKeys: publicKey,
    //format: 'binary',
    //signingKeys: privateKey
  });
  return encrypted;
}


exports.encode = async(publicKeyStr, message) => {
  return await Promise.all([
    PGP.readKey({ armoredKey: publicKeyStr }),
    PGP.createMessage({ text: message })
  ]).then( async ([publicKey, message]) => {
    const encrypted = await PGP.encrypt({
      message: message,
      encryptionKeys: publicKey,
      //format: 'binary',
      //        signingKeys: privateKey
    });
    return encrypted;
  }
  )
}


exports.decode_serial = async(privateKeyStr, labid, encrypted) => {
  const privateKey = await PGP.readPrivateKey( { armoredKey: privateKeyStr } );
  const privateKeyDecr = await PGP.decryptKey({
    privateKey: privateKey,
    passphrase: PASSPHRASE + labid
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


exports.decode = async(privateKeyStr, labid, encrypted) => {
  return await Promise.all([
    PGP.readPrivateKey({ armoredKey: privateKeyStr })
    .then( (privateKey) => {
      return PGP.decryptKey({
        privateKey: privateKey,
        passphrase: PASSPHRASE + labid
      })
    }),
    PGP.readMessage({
      armoredMessage: encrypted
    })
  ]).then( async ([ privateKeyDecr, message]) => {
    const { data: decrypted, signatures } = await PGP.decrypt({
      message,
      //verificationKeys: publicKey, // optional
      decryptionKeys: privateKeyDecr
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


exports.makeQR = async( data, api = RXAPI, apiEntry = 'rxkey' ) => {
  const { metaData, ...medical } = data;
  const key = await this.fetchKey( metaData.pseudonym_lab || '', api, apiEntry );
  
  const crypt = await exports.encode( key.key, JSON.stringify( medical ) );
  delete metaData.pseudonym_lab;

  qr_data = {
    ...metaData,
    keyver: key.version,
    apiver: apiVer,
    pseudonym: key.pseudonym,
    payload: crypt
  }

  // const jds = JSON.stringify( data );
  // const jdd = JSON.parse( jds );
  // console.log( jds, jdd);
  // console.log( JSON.stringify( data ).length )

  const qr_code = await QRCode.toDataURL( JSON.stringify( qr_data ) );

  return {
    qr_code: qr_code,
    pseudonym_lab: key.pseudonym_lab
  }
}


//const params = new URLSearchParams( data ).toString();  
//const url = `${api}/${apiEntry}?${params}`
//return QRCode.toDataURL( url ).then( url => url )
