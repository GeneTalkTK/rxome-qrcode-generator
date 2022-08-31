const { exec } = require("child_process");
const FS = require( 'fs' );

function execCmd( cmd ) {
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

describe('generate keys', () => {
  test.skip('creates two files', async () => {
    const dir = '.';
    const ex = await execCmd( 'node rxcode.js generate testsuite foo@bar.baz ' );
    const publicKeyFile = `${dir}/testsuite.public.key`;
    const privateKeyFile = `${dir}/testsuite.private.key`;
    expect( ex.error ).toBeNull();
    expect( ex.stdout ).toBe('');
    expect( ex.stderr ).toBe('');
    expect( FS.existsSync( publicKeyFile )).toBeTruthy();
    expect( FS.existsSync( privateKeyFile )).toBeTruthy();
    const privStats = FS.statSync( privateKeyFile );
    expect( privStats.size ).toBe( 850 );
    const pubStats = FS.statSync( publicKeyFile );
    expect( pubStats.size ).toBe( 624 );
    const privateKey = FS.readFileSync( privateKeyFile, { encoding: 'utf8' }, err => { console.log(err) } );
    expect( privateKey ).toContain( 'BEGIN PGP PRIVATE KEY BLOCK' );
    const publicKey = FS.readFileSync( publicKeyFile, { encoding: 'utf8' }, err => { console.log(err) } );
    expect( publicKey ).toContain( 'BEGIN PGP PUBLIC KEY BLOCK' );
  })

});

//describe('encode', () => {

//});

//describe('decode', () => {

//});
