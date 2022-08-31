const Coder = require( './assets/scripts/modules/rxome-generator' );
const { program } = require('commander');
const { generateKey } = require('openpgp');
const FS = require( 'fs' );
//const TXT = require( './assets/scripts/modules/texte.js')

program
  .name('rxcode')
  .description('RxOME.net QR Code generation tool')
  .version('1.0.0');

/*
program.command('keys')
  .description('generate public/private key pair and write to files')
  .argument('<labid>', 'RxOME laboratory id')
  .argument('<email>', 'contact email address')
  .option('-d, --directory <dir>', 'output diretory', '.')
  .action((labid, email, options) => {
    Coder.generateKeys( labid, email, options.directory )
  });

program.command('encode')
  .description('generate QR code from input data')
  .argument('<labid>', 'RxOME laboratory id')
  .option('-k, --keyfile <keyfile>', 'name of private key file (default: labid.private.key)')
  .option('-f, --inputfile <inputfile>', 'read pheno data from file (default: stdin)')
  .option('-p, --png', 'generate PNG image (default: svg)')
  
program.command('decode')
  .description('parse and decode a QR code')
  .argument('<inputfile>', 'QR code in PNG or SVG')
  .option('-k, --privatekeyfile <keyfile>', 'name of private key file for encryption', 'rxome.private.key')
  .option('-s, --signaturekeyfile <sigfile>', 'name of public key file for signature validation (default: <labid>.private.key)')
  .action((inputfile, options) => {
    //const limit = options.first ? 1 : undefined;
    console.log( `decode ${inputfile}`);
    if (!options.signaturekeyfile) {
      options.signaturekeyfile = 'foobar'
    }
    console.log( options )
  });
*/

program.command('generate')
.argument('<output filename>', 'Filename for the QR code')
.option('-i, --input <payload file>', 'File containing medical data (default: stdin)', '/dev/stdin')
.option('-d, --date <date>', 'Date (defaul: take from payload file, section metadata)')
.option('-l, --lab <lab>', 'Laboratory name (default: take from payload file, section metadata)')
.option('-e, --email <email>', 'Laboratory email (default: take from payload file, section metadata)')
.option('-t, --test', 'Use test API instead of production API')
.option('-D, --debug', 'Some output for debugging')
.action( async (output_file, options) => {
  let rawdata = FS.readFileSync( options.input );
  let qr_data  = JSON.parse(rawdata);

  ('metaData' in qr_data) || (qr_data.metaData = {});
  options.lab           && (qr_data.metaData.lab           = options.lab);
  options.date          && (qr_data.metaData.date          = options.date);
  options.email         && (qr_data.metaData.email         = options.email);
  options.pseudonym_lab && (qr_data.metaData.pseudonym_lab = options.pseudonym_lab);
  qr_api = options.test ? Coder.RXTESTAPI : Coder.RXAPI;

  options.debug && console.log( "Data ", qr_data );

  const ps_lab = await Coder.writeQR( output_file, qr_data, qr_api );
  console.log( ps_lab);
})

program.parse();

