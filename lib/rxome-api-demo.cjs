const CRYPT_PRIVATE_KEY = `
-----BEGIN PGP PRIVATE KEY BLOCK-----

xYYEY0gdfxYJKwYBBAHaRw8BAQdAYqNejQxT4gE+w2nwBvP+pe19P152F6LV
8sqM/Qhut2D+CQMIlk6wdgn1LOXgt14o00FVGL49l+pQB8umf27PPnWrJ9IS
IElQjaCsRYA3ZD/rnDUZiBGVS9++PaegYL339QT2bDp8l6VVtvcxG77svZ2n
a80Xcnh0ZXN0IDxpbmZvQHJ4b21lLm5ldD7CjAQQFgoAHQUCY0gdfwQLCQcI
AxUICgQWAAIBAhkBAhsDAh4BACEJEGvtGF4xeK/wFiEEP1IE7WS9w5iQJRD8
a+0YXjF4r/CW7AD7BlIn1BHx8kOdyrt6E0L1EKIUi88Q3jQghmvlQomsIzIB
AKW3e7gYkQJufFTlTWmD5dYmP4v3DfAGvkmFljOvHfwGx4sEY0gdfxIKKwYB
BAGXVQEFAQEHQNBoBiWwb9t6WCMulp6/opgVJ88iKOY9MpAoZ5dyEbJwAwEI
B/4JAwhZhPonkWKqteBKH35kf07JpJVMX8LWmZCqdFqXw8tmsU81LtCxVRl8
exJ0vJor/6LmBUnzMrVSG3S0PCVLw0hAfCH4nN9HxT5gEc1mFFfSwngEGBYI
AAkFAmNIHX8CGwwAIQkQa+0YXjF4r/AWIQQ/UgTtZL3DmJAlEPxr7RheMXiv
8FlgAP9S+Oc82N6iSA4gj9hOt6dz7E4YE/3XGf+7uVQb3xVYSQD6A4X+cisS
fqCVd5bPCMqAQQHjHgGBQawPK/PXyk9JxQQ=
=idJc
-----END PGP PRIVATE KEY BLOCK-----
`

const CRYPT_PUBLIC_KEY = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEY0gdfxYJKwYBBAHaRw8BAQdAYqNejQxT4gE+w2nwBvP+pe19P152F6LV
8sqM/Qhut2DNF3J4dGVzdCA8aW5mb0ByeG9tZS5uZXQ+wowEEBYKAB0FAmNI
HX8ECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRBr7RheMXiv8BYhBD9SBO1k
vcOYkCUQ/GvtGF4xeK/wluwA+wZSJ9QR8fJDncq7ehNC9RCiFIvPEN40IIZr
5UKJrCMyAQClt3u4GJECbnxU5U1pg+XWJj+L9w3wBr5JhZYzrx38Bs44BGNI
HX8SCisGAQQBl1UBBQEBB0DQaAYlsG/belgjLpaev6KYFSfPIijmPTKQKGeX
chGycAMBCAfCeAQYFggACQUCY0gdfwIbDAAhCRBr7RheMXiv8BYhBD9SBO1k
vcOYkCUQ/GvtGF4xeK/wWWAA/1L45zzY3qJIDiCP2E63p3PsThgT/dcZ/7u5
VBvfFVhJAPoDhf5yKxJ+oJV3ls8IyoBBAeMeAYFBrA8r89fKT0nFBA==
=odkw
-----END PGP PUBLIC KEY BLOCK-----
`

const R_ID = 'rxome';
const R_PUBLIC_KEY =  '4OShAt7RQ/RJA0qAvoaOQ2jx7SFBYef70XPIz7r9924=';
const R_PRIVATE_KEY = 'Rf7VbeUBQmjvAagwsWx6riaZYc7h4OBD4CuxYyZ5bgA=';
// const R_PUBLIC_KEY =  '60uReCXTn7KTEIExM4KveKstBGI3TaSrQss4biaesNs=';
// const R_PRIVATE_KEY = 'lBSkSxe/+UBWOeF5OJdQgf9qZhiI85hYE6yJCuWjCNk=';
// const R_PRIVATE_KEY = 'NamaTB+xwDFxtkQyBBkjRr5GEaXNtCw/G4qydnhQk5Y=';
// const R_PUBLIC_KEY  = 'XvbhLWKbA1wfKsx3B7FKQuDQsZTZ/dMXWiD1MehBxZg=';

const J_ID = 'rxomej'
const J_PRIVATE_KEY = 'QhcoRruGBVP39XCh8BujCE+q42qCRy/tu2CQ4YmRBgg=';
const J_PUBLIC_KEY = 'XL/i8jrJC55AdOV3zYHIIa095De5eYbDqWDPDW2r8tk=';

const DEMO_CREDENTIALS = {
  id: R_ID,
  user: 'test@rxome.net',
  key: R_PRIVATE_KEY
}

exports.CRYPT_PRIVATE_KEY = CRYPT_PRIVATE_KEY;
exports.CRYPT_PUBLIC_KEY  = CRYPT_PUBLIC_KEY; 
exports.DEMO_API_PRIVATE_KEY = R_PRIVATE_KEY;
exports.DEMO_API_PUBLIC_KEY  = R_PUBLIC_KEY; 
exports.DEMO_API_ID = R_ID;
exports.DEMO_CREDENTIALS = DEMO_CREDENTIALS;