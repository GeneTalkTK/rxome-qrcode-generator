const RxAPI = require('./rxome-api');
const FS = require('fs');
const ED = require( 'noble-ed25519' );

describe('API access', () => {
  test.skip('generates valid API access keys', async () => {
    await RxAPI.writeApiKeys( '__TESTSUITE_jesttest' );
    expect( FS.existsSync('__TESTSUITE_jesttest.private.apikey') ).toBe( true );
    expect( FS.existsSync('__TESTSUITE_jesttest.public.apikey') ).toBe( true );
    expect( FS.statSync('__TESTSUITE_jesttest.private.apikey').size - 44 ).toBeLessThan( 2 );
    expect( FS.statSync('__TESTSUITE_jesttest.public.apikey').size - 44 ).toBeLessThan( 2 );

    const message='Answer to life the universe and everything';
    const messageUi8 = RxAPI.unpack(Array.from(message));
    const privKey = RxAPI.unpack([...RxAPI.base64ToBuffer( FS.readFileSync('__TESTSUITE_jesttest.private.apikey'))])
    const pubKey = RxAPI.unpack([...RxAPI.base64ToBuffer( FS.readFileSync('__TESTSUITE_jesttest.public.apikey'))])
    const signature = await ED.sign(messageUi8, privKey);
    const isValid = await ED.verify(signature, messageUi8, pubKey);
    expect( isValid ).toBeTruthy;
  });

});