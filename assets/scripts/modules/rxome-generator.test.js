const Coder = require( './rxome-generator' );

const RXAPI = 'https://testapi.gene-talk.de/'
const RXTESTAPI = 'https://testapi.gene-talk.de';

const PRIVATE_KEY = `
-----BEGIN PGP PRIVATE KEY BLOCK-----

xYYEYmgyNxYJKwYBBAHaRw8BAQdA9l4CTUgpfKMpdhmIsu1+mFZh96Mch+5w
Znd3+fvIoz7+CQMI2zrQtpZGqZvgA0VIaMqedg6MCtUWVZR7Eb6FOhizqvo/
gNeBu4IvoHEqv8NECSfy10WFSMuDN2D4dm9E21VBcpdryNo5WOTE2qwUX7sp
tc0UZm9vYmFyIDxmb29AYmFyLmJhej7CjAQQFgoAHQUCYmgyNwQLCQcIAxUI
CgQWAAIBAhkBAhsDAh4BACEJELz7rrggWl5DFiEExPymzQI26MvyIw/1vPuu
uCBaXkOMogEAhQlj7f+riRrlpFtmL13//BHZJdAy8hNO4AUOkNjxEzcBALqS
rEoMvCeXPjju60hBzyb0rzmzWHyUKQE1R4mgJzwEx4sEYmgyNxIKKwYBBAGX
VQEFAQEHQNVKEkYa4QPXrI5553FfN1Uio4fsorJoIya8EivEbLIyAwEIB/4J
AwhP5xKSOD3XVODBWc+ZZVn9sJyvyQeyZWZ0em15ixtmxO3BF+1AzNj/1bcx
x/BsSYyX6tnEh/AjMNCZV4Cmvp+pBie+x+BBN6zJRHM837PYwngEGBYIAAkF
AmJoMjcCGwwAIQkQvPuuuCBaXkMWIQTE/KbNAjboy/IjD/W8+664IFpeQyUr
AP0VhT+Xa4lt2EvapPlXeEsdTyI5gx/87pSw6Cs21GyUwwEApgU2q4qfjsFC
yOcQrcylWRQ4NvdK9SqsEomwxTwHkQQ=
=YCih
-----END PGP PRIVATE KEY BLOCK-----
`

const PUBLIC_KEY = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEYmgyNxYJKwYBBAHaRw8BAQdA9l4CTUgpfKMpdhmIsu1+mFZh96Mch+5w
Znd3+fvIoz7NFGZvb2JhciA8Zm9vQGJhci5iYXo+wowEEBYKAB0FAmJoMjcE
CwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRC8+664IFpeQxYhBMT8ps0CNujL
8iMP9bz7rrggWl5DjKIBAIUJY+3/q4ka5aRbZi9d//wR2SXQMvITTuAFDpDY
8RM3AQC6kqxKDLwnlz447utIQc8m9K85s1h8lCkBNUeJoCc8BM44BGJoMjcS
CisGAQQBl1UBBQEBB0DVShJGGuED16yOeedxXzdVIqOH7KKyaCMmvBIrxGyy
MgMBCAfCeAQYFggACQUCYmgyNwIbDAAhCRC8+664IFpeQxYhBMT8ps0CNujL
8iMP9bz7rrggWl5DJSsA/RWFP5driW3YS9qk+Vd4Sx1PIjmDH/zulLDoKzbU
bJTDAQCmBTarip+OwULI5xCtzKVZFDg290r1KqwSibDFPAeRBA==
=YD2s
-----END PGP PUBLIC KEY BLOCK-----
`
const DEMO_DATA = 
{
  "variants": [
    {
      "testType": "Single gene sequencing",
      "variants": [
        {
          "gene": "PIGV",
          "hgnc": "26031",
          "entrez": "55650",
          "zygosity": "Homozygous",
          "hgvs": "NM_017837.4(PIGV):c.1022C>A (p.Ala341Glu)",
          "classification": "Pathogenic"
        },
        {
          "testType": "Karyotype",
          "variants": [
            {
              "iscn": "Demo ISCN Variant",
              "classification": "Benign"
            }
          ]
        }
      ]
    }
  ],
  "phenotypicFeatures": {
    "included": [
      "HP:0003155",
      "HP:0001249",
      "HP:0001250"
    ],
    "excluded": [
      "HP:0031360"
    ]
  },
  "date_birth": "2000-01-01",
  "sex": "f",
  "omim": "614207",
  "solved": true,
  "comment": "Some useful remarks",
  "metaData": {
    "date": "2022-08-31",
    "lab": "ACME Genetics",
    "email": "genetics@acme.org",
    "pseudonym_lab": "PINKYANDTHEBRAIN"
  }
}

const lab_ps = DEMO_DATA.metaData.pseudonym_lab;
const sp_bal = lab_ps.split('').reverse().join('');

describe('fetchKey', () => {
  // using async/await:
  test('should fetch key and pseudonyme', async () => {
    const result = await Coder.fetchKey( '', RXTESTAPI );
    //console.log( PUBLIC_KEY )
    //console.log( result.key )
    expect( result.pseudonym ).toBe( 'HANSMOTKAMP' );
  });

  // using .then:
  test('should fetch key and pseudonyme', () => {
    return Coder.fetchKey( '', RXTESTAPI ).then( result => {
      expect( result.pseudonym ).toBe( 'HANSMOTKAMP' );
      expect( result.pseudonym_lab ).toBe( 'SANKTHAMMOP' );
      expect( result.key.trim() ).toBe( PUBLIC_KEY.trim() );
      expect( result.version ).toBe( '0.1' );
    });
  });

  test('should fetch key and pseudonyme for given lab ps', () => {
    return Coder.fetchKey( lab_ps, RXTESTAPI ).then( result => {
      expect( result.pseudonym ).toBe( sp_bal );
      expect( result.pseudonym_lab ).toBe( lab_ps );
      expect( result.key.trim() ).toBe( PUBLIC_KEY.trim() )
    });
  });
  // error handling:
  test('should raise an error', () => {
    Coder.fetchKey( '', 'https://testapi.gene-talk.de/schnitzel/', 'fehler' )
    .then( data =>  { console.log( data ) })
    .catch(err => {
      expect( err.message ).toMatch( '404' );
      expect( err.response.data ).toBeDefined();
      expect( err.response.data.errors ).toMatch( 'Guru' );
    });
  });
});

describe('fetchDemoKey', () => {
  test('should fetch private key', () => {
    return Coder.fetchDemoPrivateKey().then( result => {
      expect( result.private_key.trim() ).toBe( PRIVATE_KEY.trim() )
    });
  });
});

describe('Coder', () => {
  test('should encode and decode', () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    Coder.encode( PUBLIC_KEY, message)
    .then( cipher => Coder.decode( PRIVATE_KEY, '', cipher ) )
    .then( clear => expect( clear ).toBe( message ) )
  })
  
  test('should encode and decode with key from server', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const keypkg = await Coder.fetchKey( '', RXTESTAPI );
    expect( keypkg.pseudonym ).toBe( 'HANSMOTKAMP' );
    const cipher = await Coder.encode( keypkg.key, message);
    const clear  = await Coder.decode( PRIVATE_KEY, '', cipher );
    expect( clear ).toBe( message );
  })
});

describe('Serial version of coder', () => {
  test('should encode and decode', () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    Coder.encode_serial( PUBLIC_KEY, message)
    .then( cipher => Coder.decode_serial( PRIVATE_KEY, '', cipher ) )
    .then( clear => expect( clear ).toBe( message ) )
  })
  
  test('should encode and decode with key from server', async () => {
    const message = 'A-well-a bird bird bird, bird is the word';
    const keypkg = await Coder.fetchKey( '', RXTESTAPI );
    const { private_key } = await Coder.fetchDemoPrivateKey();
    expect( keypkg.pseudonym ).toBe( 'HANSMOTKAMP' );
    const cipher = await Coder.encode( keypkg.key, message);
    const clear  = await Coder.decode( private_key, '', cipher );
    expect( clear ).toBe( message );
  })
});

describe('QR Code generator', () => {
  test('should make QR code', async () => {
    const newData = { ...DEMO_DATA, metaData: { ...DEMO_DATA.metaData }};
    delete newData.metaData.pseudonym_lab;
    const { qr_code, pseudonym_lab } = await Coder.makeQR ( 
      newData,
      RXTESTAPI 
    );
    //expect( qr_code.length ).toBe( 25750 );
    expect( qr_code.startsWith( '    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiQAAAIkCAYAAAAu8zBwAAA2qElEQVR4AezBQQ4by5LAQFLw/a/MectcF')).toBeTruthy;
    console.log( qr_code.length );
    expect( pseudonym_lab ).toBe( 'SANKTHAMMOP' );
  })
});

describe('QR Code generator with given lab ps', () => {
  test('should make QR code', async () => {
    const { qr_code, pseudonym_lab } = await Coder.makeQR ( 
      DEMO_DATA,
      RXTESTAPI 
    );
    //expect( qr_code.length ).toBe( 25750 );
    expect( qr_code.startsWith( '    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiQAAAIkCAYAAAAu8zBwAAA2qElEQVR4AezBQQ4by5LAQFLw/a/MectcF')).toBeTruthy;
    console.log( qr_code.length );
    expect( pseudonym_lab ).toBe( lab_ps );
  })
});