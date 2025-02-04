const Axios = require( 'axios' );
const ED = require( 'noble-ed25519' );
const Protobuf = require('protobufjs');
const { stringify } = require('querystring');
//const BASE64 = require('@protobufjs/base64')

const API = 'https://app.findme2care.de';
const TESTAPI = 'https://stage.findme2care.de';
const APIENTRY = 'api/v1';
const VSTR = 'API1.0'
const IS_DEMO = '_DEMO_PSEUDONYM_';

exports.API = API;
exports.TESTAPI = TESTAPI;
exports.APIENTRY = APIENTRY;
exports.VSTR = VSTR;
exports.IS_DEMO = IS_DEMO;

/************************************************************************************
 * Helper functions
 ************************************************************************************/

// have issues:
const base64ToBufferVintage = data => atob(data.toString());
//const bufferToBase64 = data => Buffer.from(data).toString('base64');
 
const unpack = (arr) => Uint8Array.from( arr.map( c => c.charCodeAt(0) ));
 
let readSigKey = name => { console.log("Error: not supported") }

const base64ToBuffer = enc => {
  const len = Protobuf.util.base64.length(enc);
  let buf = new Protobuf.util.Array( len );
  Protobuf.util.base64.decode(enc, buf, 0);
  return buf;
}

const bufferToBase64 = buf => {
  return Protobuf.util.base64.encode(buf, 0, buf.length);
}

exports.base64ToBuffer = base64ToBuffer;
exports.bufferToBase64 = bufferToBase64;
exports.unpack = unpack;


/************************************************************************************
 * Functions for node.js only
 ************************************************************************************/

 try {
  const FS = require( 'fs' );
  
  readSigKey = name => {
    if (!FS.existsSync( name )) {
      throw 'Key file not found!';
    }
    return FS.readFileSync( name ).slice(0,44);
  }

  exports.generateApiKeys = async () => {
    const privateKey = ED.utils.randomPrivateKey();
    const publicKey = await ED.getPublicKey(privateKey);
    return {
      privateKey: privateKey,
      publicKey: publicKey
    }
  }

  exports.writeApiKeys = async (name = 'rxome', dir = '.') => {
    const key = await this.generateApiKeys();
    await Promise.all([
      FS.writeFile( `${dir}/${name}.private.apikey`, bufferToBase64( key.privateKey ), { mode: 0o600 }, err => { if (err) throw err; } ),
      FS.writeFile( `${dir}/${name}.public.apikey`, bufferToBase64( key.publicKey ), { mode: 0o600 }, err => { if (err) throw err; } )
    ]);
  }

}
catch (e) {
 if (e instanceof Error && e.code !== "MODULE_NOT_FOUND") {
   throw e;
 }
}

exports.readSigKey = readSigKey;

/************************************************************************************/

exports.signData = async( keyId, user, keyB64, created, debug = false ) => {
  const message = `x-date: ${created}\nx-rxome-user: ${user}`
  const messageUi8 = unpack( Array.from(message) );

  const key = unpack( [...base64ToBufferVintage(keyB64)] );
  debug && console.log('Base 64 key: ', keyB64);
  debug && console.log('Binary key: ', key, " Key length: ", key.length);

  const signature = await ED.sign( messageUi8, key);
  const sigB64 = bufferToBase64( signature );
  const auth=`Signature keyId=\"${keyId}\",algorithm=\"ed25519\",headers=\"x-date x-rxome-user\",signature=\"${sigB64}\",created=\"${created}\"`
  debug && console.log('Auth string: ', auth);

  return auth;
}


exports.fetchData = async ( url, credentials, pseudonym = '', debug = false ) => {
  debug && console.log( 'Fetching from', url )

  const created = Date.now();
  const keyId = credentials.keyId || "rxome";
  const user = credentials.user || `${keyId}@rxome.net`;
  const keyB64 = credentials.key || readSigKey( process.cwd()+'/'+credentials.keyFile );

  const auth = await exports.signData( keyId, user, keyB64, created, debug );

  FS = require( 'fs' );
  return Axios({
                url: url,
                method: 'GET',
                params: { 
                  pslab: !!pseudonym.trim(),
                  demo: pseudonym === IS_DEMO
                },
                headers: {		
                  Authorization: auth,
                  'x-date': created,
                  'x-rxome-user': user
                },
                timeout: 5000
          })
          .then(res => {
            debug && console.log( "Result Data= ", res.data )
            return res.data
          })
}

exports.pushData = async ( url, credentials, msg, debug = false ) => {
  debug && console.log( 'Pushing to ', url )
  console.log( 'Pushing to ', url )

  const created = Date.now();
  const keyId = credentials.keyId || "rxome";
  const user = credentials.user || `${keyId}@rxome.net`;
  const keyB64 = credentials.key || readSigKey( process.cwd()+'/'+credentials.keyFile );

  const auth = await exports.signData( keyId, user, keyB64, created, debug );

  FS = require( 'fs' );
  return Axios({
                url: url,
                method: 'POST',
                data: msg,
                headers: {	
                  Authorization: auth,
                  'x-date': created,
                  'x-rxome-user': user
                },
                timeout: 5000
          })
          .then(res => {
            debug && console.log( "Result Data= ", res.data )
            return res.data
          })
          .catch( (error) => {
            // setIsLoading(false);
            let msg=null;
            if (error.response) {
              // Request made and server responded
              if (error.response?.data?.message){
                console.log( '[SendData Response Error] ', error.response.data.message );
                msg=`Response Error: ${error.response.data.message}`;
                console.log(error.response.data);
              } else {
                console.log( '[SendData Response Error] no message' );
                msg='Unknown response error';
              }
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              console.log('[SendData Request Error]  ', error.request);
              msg = 'No response from server';
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('[SendData Request Error]  ', error.message);
              msg = `Request Error: ${error.message}`;
            }  
            const err = new Error( `Error sending data: ${msg}` );
            console.log(err.name + ': ' + err.message);
            throw err;
          })
}
