const Coder = require('./rxome-generator');
const RxAPI = require( './rxome-api' );
const ApiDemo = require( './rxome-api-demo');

const FS = require('fs');
const Axios = require( 'axios' );

const RXAPI = RxAPI.API;
const RXTESTAPI = RxAPI.TESTAPI;
// const RXTESTAPI = 'http://localhost:3000';
const RXLOCALAPI = 'http://localhost:3000';

const CREDENTIALS = {
  id: ApiDemo.DEMO_API_ID,
  user: 'test@rxome.net',
  key: ApiDemo.DEMO_API_PRIVATE_KEY
}

const DEMO_DATA = JSON.parse(FS.readFileSync('./demos/demo_data_full.json'));

const DEMO_DATA_COMPRESSED = JSON.parse(FS.readFileSync('./demos/demo_data_full_compressed.json'));
// compressed: without credentials due to whitelist/phenopacket filtering

const DEMO_PSEUDONYM = 'HANSMOTKAMP';
const EMPTY_PSEUDONYM = '';

const PRIVATE_KEY = ApiDemo.CRYPT_PRIVATE_KEY;
const PUBLIC_KEY  = ApiDemo.CRYPT_PUBLIC_KEY;
const DEMO_API_PRIVATE_KEY = ApiDemo.DEMO_API_PRIVATE_KEY;
const DEMO_API_PUBLIC_KEY  = ApiDemo.API_PUBLIC_KEY; 

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('API access', () => {

  test('is able to connect to API', async () => {
    await expect( Coder.fetchKey(CREDENTIALS, RxAPI.IS_DEMO, RXTESTAPI) ).resolves.not.toThrowError();
  });

  // test.skip('should fetch key and pseudonyms', async () => {
  //   Coder.fetchKey(CREDENTIALS, '', RXTESTAPI)
  //   .then( result => {
  //     //console.log( PUBLIC_KEY )
  //     //console.log( result.key )
  //     expect(result.pseudonym).toBe(DEMO_PSEUDONYM);
  //     expect(result.key.trim()).toBe(PUBLIC_KEY.trim())
  //   })
  //   .catch( e  => process.stderr.write( e.message ));
  // });

  test('should fetch key and pseudonyms', () => {
    Coder.fetchKey(CREDENTIALS, RxAPI.IS_DEMO, RXTESTAPI)
    .then(result => {
      expect(result.pseudonym).toBe(DEMO_PSEUDONYM);
      expect(result.key.trim()).toBe(PUBLIC_KEY.trim());
      expect(result.version).toBe('0_1');
    });
  });

  test('should not fetch pseudonyme for given lab ps', () => {
    const lab_ps = (Math.random() + 1).toString(36).substring(2,12)
    Coder.fetchKey(CREDENTIALS, lab_ps, RXTESTAPI).then(result => {
      expect(result.pseudonym).toBe(lab_ps);
    });
  });

  // error handling:
  test('should raise an error when url is wrong', () => {
    Coder.fetchKey(CREDENTIALS, '', RXTESTAPI, false, '/api/v1/errortest')
      .then(data => { })
      .catch(err => {
        expect(err.message).toMatch('404');
        expect(err.response.data).toBeDefined();
      });
  });

  test('should raise an error when id is wrong', () => {
    const lab_ps = (Math.random() + 1).toString(36).substring(2,12);
    const wrong_credentials = {
      id: 'intruder',
      user: 'test@rxome.net',
      key: DEMO_API_PRIVATE_KEY
    }
    Coder.fetchKey(wrong_credentials, 'lab_ps', RXTESTAPI)
      .then(data => { })
      .catch(err => {
        expect(err.response.status.toString().toMatch('403'));
      });
  });

  test('should raise an error when key is wrong', () => {
    const lab_ps = (Math.random() + 1).toString(36).substring(2,12);
    const wrong_credentials = {
      id: 'rxome',
      user: 'test@rxome.net',
      key: DEMO_API_PRIVATE_KEY.split('').reverse().join('')
    }
    Coder.fetchKey(wrong_credentials, 'lab_ps', RXTESTAPI)
      .then(data => { })
      .catch(err => {
        expect(err.response?.status.toString().toMatch('403'));
      });
  });
});


describe('fetchDemoKey', () => {
  test('should fetch private key', () => {
    Coder.fetchDemoPrivateKey(CREDENTIALS, RXTESTAPI )
    .then(result => {
      expect(result.private_key.trim()).toBe(PRIVATE_KEY.trim())
    })
    .catch( err => { process.stderr.write( JSON.stringify( err ))});
  });
});


describe('Phenopackets preprocessor', () => {
  test('converts camelCase to snake_case', () => {
    const snake = Coder.convert_to_snake_case(DEMO_DATA);
    const camel = Coder.convertToCamelCase(snake);
    expect(JSON.stringify(snake).match(/_/g).length).toBe( 33 );
    expect(camel).toEqual(DEMO_DATA);
  });

  test('sanitizes sex record', () => {
    expect(Coder.sanitizeSex('UNKNOWN_SEX')).toBe(0);
    expect(Coder.sanitizeSex('UNKNOWN')).toBe(0);
    expect(Coder.sanitizeSex('FEMALE')).toBe(1);
    expect(Coder.sanitizeSex('female')).toBe(1);
    expect(Coder.sanitizeSex('MALE')).toBe(2);
    expect(Coder.sanitizeSex('MaLe')).toBe(2);
    expect(Coder.sanitizeSex('OTHER_SEX')).toBe(3);
    expect(Coder.sanitizeSex('OTHER')).toBe(3);
    expect(Coder.sanitizeSex('FlyingSpaghettiMonster')).toBe(0);
    expect(Coder.sanitizeSex('0')).toBe(0);
    expect(Coder.sanitizeSex('1')).toBe(1);
    expect(Coder.sanitizeSex('2')).toBe(2);
    expect(Coder.sanitizeSex('3')).toBe(3);
    expect(Coder.sanitizeSex(0)).toBe(0);
    expect(Coder.sanitizeSex(1)).toBe(1);
    expect(Coder.sanitizeSex(2)).toBe(2);
    expect(Coder.sanitizeSex(3)).toBe(3);
  });

  test('sanitizes progress status', () => {
    expect(Coder.sanitizeProgState('UNKNOWN_PROGRESS')).toBe(0);
    expect(Coder.sanitizeProgState('unknown_progress')).toBe(0);
    expect(Coder.sanitizeProgState('IN_PROGRESS')).toBe(1);
    expect(Coder.sanitizeProgState('In_PrOgReSs')).toBe(1);
    expect(Coder.sanitizeProgState('COMPLETED')).toBe(2);
    expect(Coder.sanitizeProgState('SOLVED')).toBe(3);
    expect(Coder.sanitizeProgState('UNSOLVED')).toBe(4);
    expect(Coder.sanitizeProgState('Its_Complicated')).toBe(0);
    expect(Coder.sanitizeProgState('0')).toBe(0);
    expect(Coder.sanitizeProgState('1')).toBe(1);
    expect(Coder.sanitizeProgState('2')).toBe(2);
    expect(Coder.sanitizeProgState('3')).toBe(3);
    expect(Coder.sanitizeProgState('4')).toBe(4);
    expect(Coder.sanitizeProgState(0)).toBe(0);
    expect(Coder.sanitizeProgState(1)).toBe(1);
    expect(Coder.sanitizeProgState(2)).toBe(2);
    expect(Coder.sanitizeProgState(3)).toBe(3);
    expect(Coder.sanitizeProgState(4)).toBe(4);
  });

  test('sanitizes ACMG classification', () => {
    expect(Coder.sanitizeACMG('NOT_PROVIDED')).toBe(0);
    expect(Coder.sanitizeACMG('BENIGN')).toBe(1);
    expect(Coder.sanitizeACMG('benign')).toBe(1);
    expect(Coder.sanitizeACMG('LIKELY_BENIGN')).toBe(2);
    expect(Coder.sanitizeACMG('LIKELY_BENIGN')).toBe(2);
    expect(Coder.sanitizeACMG('UNCERTAIN_SIGNIFICANCE')).toBe(3);
    expect(Coder.sanitizeACMG('LIKELY_PATHOGENIC')).toBe(4);
    expect(Coder.sanitizeACMG('PATHOGENIC')).toBe(5);
    expect(Coder.sanitizeACMG('Excellent ')).toBe(0);
    expect(Coder.sanitizeACMG('Legen(wait for it)dary')).toBe(0);
    expect(Coder.sanitizeACMG('0')).toBe(0);
    expect(Coder.sanitizeACMG('1')).toBe(1);
    expect(Coder.sanitizeACMG('2')).toBe(2);
    expect(Coder.sanitizeACMG('3')).toBe(3);
    expect(Coder.sanitizeACMG('4')).toBe(4);
    expect(Coder.sanitizeACMG('5')).toBe(5);
    expect(Coder.sanitizeACMG(0)).toBe(0);
    expect(Coder.sanitizeACMG(1)).toBe(1);
    expect(Coder.sanitizeACMG(2)).toBe(2);
    expect(Coder.sanitizeACMG(3)).toBe(3);
    expect(Coder.sanitizeACMG(4)).toBe(4);
    expect(Coder.sanitizeACMG(5)).toBe(5);
  });

  test('sanitizes phenopackets', () => {
    const data = Coder.sanitizePhenoPacket(DEMO_DATA);
    expect(DEMO_DATA.subject.sex).toBe('FEMALE');
    expect(data.subject.sex).toBe(1);
    expect(DEMO_DATA.interpretations[0].progressStatus).toBe('SOLVED');
    expect(data.interpretations[0].progressStatus).toBe(3);
    expect(DEMO_DATA.interpretations[0].diagnosis.genomicInterpretations[0].variantInterpretation.acmgPathogenicityClassification).toBe('PATHOGENIC');
    expect(data.interpretations[0].diagnosis.genomicInterpretations[0].variantInterpretation.acmgPathogenicityClassification).toBe(5);
  });

  test('removes non-whitelisted items', () => {
    const blackData = {
      blackList: { badGuys: ['DarthVader', 'Sauron', 'Thanos'] },
      ...DEMO_DATA,
      evilData: { name: 'Lore', firstEpisode: "Datalore"}
    }
    expect(Coder.whiteListPhenoPacket( blackData )).toEqual( DEMO_DATA );
  })

  test('works with phenopacket without phenotypicFeatures', () => {
    const newData = { ...DEMO_DATA };
    delete newData.phenotypicFeatures;
    expect(Coder.compressPhenoPacket( newData )).toEqual( newData );
  });

  test('compresses phenopackets', () => {
    expect(Coder.compressPhenoPacket(DEMO_DATA)).toEqual(DEMO_DATA_COMPRESSED);
  });

  test('codes and decodes protobuf packets', async () => {
    const newData = { ...DEMO_DATA };
    delete newData.credentials;
    const sanData = Coder.sanitizePhenoPacket(newData);
    const protoBuf = Coder.encodePhenoPacket(sanData);
    const phenoPrime = Coder.decodePhenoPacket(protoBuf); //decode inserts ENUM strings
    const pheno = JSON.parse(JSON.stringify(phenoPrime));
    expect(pheno).toEqual(newData);
  });

  test('codes and decodes compressed protobuf packets', async () => {
    const newData = { ...DEMO_DATA_COMPRESSED };
    delete newData.credentials;
    const sanData = Coder.sanitizePhenoPacket(newData);
    const protoBuf = Coder.encodePhenoPacket(sanData);
    const phenoPrime = Coder.decodePhenoPacket(protoBuf); //decode inserts ENUM strings
    const pheno = JSON.parse(JSON.stringify(phenoPrime));
    expect(pheno).toEqual(newData);
  });
});


describe('Coder', () => {
  test('should encode and decode', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const { privateKey, publicKey } = await Coder.generateRxomeKeys();
    Coder.encode(publicKey, message)
      .then(cipher => Coder.decode(privateKey, cipher))
      .then(clear => expect(clear).toBe(message))
  })

  test('should encode and decode binary data', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const { privateKey, publicKey } = await Coder.generateRxomeKeys();
    const textEncoder = new TextEncoder(); // to Uint8Array
    const textDecoder = new TextDecoder(); //default: to utf8
    const binaryMessage = textEncoder.encode( message );

    Coder.encode( publicKey, binaryMessage, true )
      .then( cipher => Coder.decode(privateKey, cipher, true))
      .then( binaryClear => {
        const clear = textDecoder.decode( binaryClear );
        expect( binaryClear ).toEqual( binaryMessage );
        expect( clear ).toBe( message );
      })
  })

  test('should encode and decode with key from server', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const keypkg = await Coder.fetchKey(CREDENTIALS, RxAPI.IS_DEMO, RXTESTAPI);
    expect(keypkg.pseudonym).toBe(DEMO_PSEUDONYM);
    const cipher = await Coder.encode(keypkg.key, message);
    const clear = await Coder.decode(PRIVATE_KEY, cipher);
    expect(clear).toBe(message);
  })

  test('should encode and decode with key files', async () => {
    const message = 'Be Sure To Drink Your Ovaltine';
    await Coder.generateRxomeKeyFiles( 'testsuite' );
    const privateKey = FS.readFileSync('./testsuite.private.key').toString();
    const publicKey = FS.readFileSync('./testsuite.public.key').toString();
    const cipher = await Coder.encode(publicKey, message);
    const clear = await Coder.decode(privateKey, cipher);
    expect(clear).toBe(message);
  })
});


describe('Rails', () => {
  test('should be able to decode cipher', async() => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const cipher = await Coder.encode(PUBLIC_KEY, message);

    const res = await Axios({
      method$: 'GET',
      url: `${RXTESTAPI}/api/v1/decryptTest`,
      data: {
        cipher: cipher
      }
    })
    expect( res.data?.clearText ).toEqual( message ) 
  });
});


describe('Serial version of coder', () => {
  test('should encode and decode', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const { privateKey, publicKey } = await Coder.generateRxomeKeys();
    Coder.encode_serial(publicKey, message)
      .then(cipher => Coder.decode_serial(privateKey, cipher))
      .then(clear => expect(clear).toBe(message))
  })

  test('should encode and decode with key from server', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const keypkg = await Coder.fetchKey(CREDENTIALS, RxAPI.IS_DEMO, RXTESTAPI, false);
    const { private_key } = await Coder.fetchDemoPrivateKey(CREDENTIALS, RXTESTAPI)
    //.then( data => {console.log( data )})
    //.catch( err => { process.stderr.write( JSON.stringify( err ))})
    expect(keypkg.pseudonym).toBe(DEMO_PSEUDONYM);
    const cipher = await Coder.encode(keypkg.key, message);
    const clear = await Coder.decode(private_key, cipher);
    expect(clear).toBe(message);
  })
});


describe('QR Code generator', () => {
  test('should make QR code', async () => {
    const newData = { ...DEMO_DATA, metaData: { ...DEMO_DATA.metaData } };
    delete newData.metaData.pseudonym;
    //const { qr_code, pseudonym } = await 
    Coder.makeQR(
      newData,
      RXTESTAPI
    )
    .then( data => {
      expect( data.qr_code.startsWith('    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiQAAAIkCAYAAAAu8zBwAAA2qElEQVR4AezBQQ4by5LAQFLw/a/MectcF')).toBeTruthy;
      expect( data.pseudonym ).toBe(DEMO_PSEUDONYM);
      expect( data.qr_data ).toBe( newData );
    })
    .catch( err => { process.stderr.write( JSON.stringify( err ))})
  })

  test('should make QR code when given lab ps', async () => {
    const lab_ps = (Math.random() + 1).toString(36).substring(2,12);
    const newData = { 
                      ...DEMO_DATA, 
                      metaData: { 
                                  ...DEMO_DATA.metaData, 
                                  pseudonym: lab_ps 
                                }
                    };

    const { qr_code, pseudonym } = await Coder.makeQR(
      newData,
      RXTESTAPI
    );
    expect(qr_code.startsWith('    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiQAAAIkCAYAAAAu8zBwAAA2qElEQVR4AezBQQ4by5LAQFLw/a/MectcF')).toBeTruthy;
    //console.log(qr_code.length);
    expect(pseudonym).toBe( lab_ps );
  })
});


describe('QR Code generator', () => {
  test('codes and decodes encrypted protobuf packets', async () => {
    const newData = { ...DEMO_DATA_COMPRESSED, metaData: { ...DEMO_DATA_COMPRESSED.metaData } };
    const sanitizedMedical = Coder.sanitizePhenoPacket( newData );
    const compressedMedical = Coder.compressPhenoPacket( sanitizedMedical );
    const protobufMedical = Coder.encodePhenoPacket( compressedMedical );
    const protobufMedicalB64 = RxAPI.bufferToBase64( protobufMedical );
    const cipher = await Coder.encode(PUBLIC_KEY, protobufMedicalB64)
    
    const clear = await Coder.decode(PRIVATE_KEY, cipher)
    const data = Uint8Array.from([...atob(clear) ].map( c => c.charCodeAt(0)));
    // TODO: why not const data2 = RxAPI.base64ToBuffer( clear );
    const pheno = Coder.decodePhenoPacket(data);
    const phenoJ = JSON.parse(JSON.stringify(pheno));
    delete newData.credentials;
    expect( phenoJ ).toEqual( newData );
  })
});