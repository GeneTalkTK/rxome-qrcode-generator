const { exec } = require("child_process");
const FS = require( 'fs' );
//const { default: test } = require("node:test");
const Coder = require( './lib/rxome-generator' );

DEMO_TEXT = 'answer to life the universe and everything'

DEMO_CIPHER = `
-----BEGIN PGP MESSAGE-----

wV4DwTe9/0b1zzgSAQdAxe4Phva3n19MInlPhQS4OxG78y+3mTsNHVfsk5OF
nGAwld5yaBCzLoudwGLQ17qIkABl9rhONf8VJMNoTOZOf8nPoouCKdXxktv7
dG1wvV2s0lsBvUBUmaOzix1hEF6YeUr7mfc+MBBt/2gfoyT4Kujgrg25YoZ6
qUgqga2eSZ6O+OhyjuFo3rZVXl1MFY6lfu+X+i4cCE2VWiAQOwVNnqFdY9FF
uOPuzhz7UstK
=KKxC
-----END PGP MESSAGE-----
`

const PRIVATE_KEY = Coder.DEMO_PRIVATE_KEY;
const PUBLIC_KEY = Coder.DEMO_PUBLIC_KEY;

jest.setTimeout(70000)

async function execCmd( cmd ) {
  // process.stderr.write( `Executing ${cmd}` )
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      const result = {
        error: error,
        stdout: stdout,
        stderr: stderr
      }
      if (error) {
        console.warn(error);
      }
      resolve( result );
    });
  });
}

describe('CmdLine generate', () => {
  test('generates a qr code from demo data', () => {
    if ( FS.existsSync( '__TESTSUITE_IMG.png' )) {
      FS.rmSync( '__TESTSUITE_IMG.png' );
    }
    execCmd( 'rxcode g -t -o __TESTSUITE_IMG.png demos/demo_data_full.json' )
    // execCmd( 'rxcode g -L -o __TESTSUITE_IMG.png demos/demo_data_full.json' )
    .then( res => {
      expect( res.error ).toBeNull();
      expect( res.stdout ).toBe('HANSMOTKAMP\n');
      expect( res.stderr ).toBe('');
      expect( FS.existsSync( '__TESTSUITE_IMG.png' )).toBeTruthy();
      const fileStats = FS.statSync( '__TESTSUITE_IMG.png' );
      expect( Math.floor( fileStats.size / 100 )-215).toBeLessThan( 4 );
    })
    .catch( err => { process.stderr.write( JSON.stringify( err ))})
  });
});


describe('generate keys', () => {
  test('creates two files', async () => {
    const dir = '.';
    const ex = await execCmd( 'rxcode K __TESTSUITE' );
    const publicKeyFile = `${dir}/__TESTSUITE.public.key`;
    const privateKeyFile = `${dir}/__TESTSUITE.private.key`;
    expect( ex.error ).toBeNull();
    expect( ex.stdout ).toBe('');
    expect( ex.stderr ).toBe('');
    expect( FS.existsSync( publicKeyFile )).toBeTruthy();
    expect( FS.existsSync( privateKeyFile )).toBeTruthy();
    const privStats = FS.statSync( privateKeyFile );
    expect( Math.floor( privStats.size / 100 )).toBe( 8 );
    const pubStats = FS.statSync( publicKeyFile );
    expect( Math.floor( pubStats.size / 10 )).toBe( 62 );
    const privateKey = FS.readFileSync( privateKeyFile, { encoding: 'utf8' }, err => { console.log(err) } );
    expect( privateKey ).toContain( 'BEGIN PGP PRIVATE KEY BLOCK' );
    const publicKey = FS.readFileSync( publicKeyFile, { encoding: 'utf8' }, err => { console.log(err) } );
    expect( publicKey ).toContain( 'BEGIN PGP PUBLIC KEY BLOCK' );
  })

});

describe('Cmdline encode', () => {
  test('encodes json input', async() => {
    execCmd( './rxcode e -j ./demos/demo_encrypt.json > __TESTSUITE_FILE_1' )
    .then( res => {
      expect( res.error ).toBeNull();
      expect( res.stdout ).toBe('');
      expect( res.stderr ).toBe('');
      expect( FS.existsSync( '__TESTSUITE_FILE_1' )).toBeTruthy();
      const fileStats = FS.statSync( '__TESTSUITE_FILE_1' );
      expect( Math.floor( fileStats.size / 100 )).toBe( 3 );
      const fileContent = FS.readFileSync( '__TESTSUITE_FILE_1', { encoding: 'utf8' }, err => { process.stderr.write(err) } );
      expect( fileContent ).toContain( '-----BEGIN PGP MESSAGE-----' );
      //FS.rmSync( '__TESTSUITE_FILE_1')
    })
    .catch( err => { process.stderr.write( JSON.stringify( err ))})  
  })

  test('decodes json input', async() => {
    execCmd( './rxcode d -j ./demos/demo_decrypt.json > __TESTSUITE_FILE_2' )
    .then( res => {
      expect( res.error ).toBeNull();
      expect( res.stdout ).toBe('');
      expect( res.stderr ).toBe('');
      expect( FS.existsSync( '__TESTSUITE_FILE_2' )).toBeTruthy();
      const fileStats = FS.statSync( '__TESTSUITE_FILE_2' );
      expect( fileStats.size ).toBe( 42 );
      const fileContent = FS.readFileSync( '__TESTSUITE_FILE_2', { encoding: 'utf8' }, err => { process.stderr.write(err) } );
      expect( fileContent ).toContain( DEMO_TEXT );
      //FS.rmSync( '__TESTSUITE_FILE_1')
    })
    .catch( err => { process.stderr.write( JSON.stringify( err ))})   
  })

  test('encodes and decodes a text file', async() => {
    FS.writeFileSync( '__TESTSUITE_FILE_3', DEMO_TEXT );
    execCmd( './rxcode e -k ./demos/demo.public.key -o __TESTSUITE_FILE_4 __TESTSUITE_FILE_3' )
    .then( res => {
      expect( res.error ).toBeNull();
      expect( res.stdout ).toBe('');
      expect( res.stderr ).toBe('');
      expect( FS.existsSync( '__TESTSUITE_FILE_4' )).toBeTruthy();

      execCmd( './rxcode d -k ./demos/demo.private.key -o __TESTSUITE_FILE_5 __TESTSUITE_FILE_4' )
      .then( res => {
        expect( res.error ).toBeNull();
        expect( res.stdout ).toBe('');
        expect( res.stderr ).toBe('');
        expect( FS.existsSync( '__TESTSUITE_FILE_5' )).toBeTruthy();
        const fileStats = FS.statSync( '__TESTSUITE_FILE_5' );
        expect( fileStats.size ).toBe( 42 );
        const fileContent = FS.readFileSync( '__TESTSUITE_FILE_5', { encoding: 'utf8' } );
        expect( fileContent ).toContain( DEMO_TEXT );
        //FS.rmSync( '__TESTSUITE_FILE_1')
      })
      //.catch( err => { process.stderr.write( JSON.stringify( err ))})
    })
    //.catch( err => { process.stderr.write( JSON.stringify( err ))})
  }, 100000)

  test('encodes and decodes from stdin to stdout file', async() => {
    FS.writeFileSync( '__TESTSUITE_FILE_6', DEMO_TEXT );
    execCmd( './rxcode e -k ./demos/demo.public.key < __TESTSUITE_FILE_6 > __TESTSUITE_FILE_7' )
    .then( res => {
      expect( res.error ).toBeNull();
      expect( res.stdout ).toBe('');
      expect( res.stderr ).toBe('');
      expect( FS.existsSync( '__TESTSUITE_FILE_7' )).toBeTruthy();

      execCmd( './rxcode d -k ./demos/demo.private.key < __TESTSUITE_FILE_7 > __TESTSUITE_FILE_8' )
      .then( res => {
        expect( res.error ).toBeNull();
        expect( res.stdout ).toBe('');
        expect( res.stderr ).toBe('');
        expect( FS.existsSync( '__TESTSUITE_FILE_8' )).toBeTruthy();
        const fileStats = FS.statSync( '__TESTSUITE_FILE_8' );
        expect( fileStats.size ).toBe( 42 );
        const fileContent = FS.readFileSync( '__TESTSUITE_FILE_8', { encoding: 'utf8' } );
        expect( fileContent ).toContain( DEMO_TEXT );
        //FS.rmSync( '__TESTSUITE_FILE_1')
      })
      //.catch( err => { process.stderr.write( JSON.stringify( err ))}) 
    });    
  })
});

// //});
// describe('CmdLine help', async () => {
//   test.skip( 'show help', () => {
//     const result =  execCmd( 'rxcode --help');
    
//   })

// });

// describe('CmdLine decode', async () => {
//   test.skip( 'decodes file', () => {
//   });

// });
/*
echo -n 'the answer to life the universe and everything' | rxcode e -k rxome.public.key  > rxome.message

rxcode d rxome.message
rxcode d < rxome.message
rxcode d -j rxome.decrypt.json 
rxcode d -j rxome.decrypt.json
rxcode d -j < rxome.decrypt

*/
