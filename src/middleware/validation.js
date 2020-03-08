const { body } = require('express-validator/check');
const User = require('../models/user');

const validate = method => {
  switch (method) {
    case 'postLogin': {
      return [
        body('email', '* Felaktig epostadress eller lösenord')
          .isEmail()
          .normalizeEmail(),
        body('password', '* Felaktig epostadress eller lösenord')
          .trim()
          .isLength({ min: 6 })
      ];
    }
    case 'postSignup': {
      return [
        body('name')
          .not()
          .isEmpty()
          .withMessage(`* Namn saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken under 'Namn'`),
        body('email')
          .isEmail()
          .withMessage('* Ange en giltig epostadress')
          .normalizeEmail()
          .custom(async email => {
            const user = await User.findOne({ email });
            if (!user) {
              return true;
            }
            throw new Error('* Epostadressen används redan');
          }),
        body('phone')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Telefonnummer saknas`)
          .matches(/^[0-9 .,+-]+$/i)
          .withMessage('* Ange ett giltigt telefonnummer'),
        body('street')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Gatuadress saknas`)
          .matches(/[0-9a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken under 'Gatuadress'`),
        body('zip')
          .not()
          .isEmpty()
          .withMessage(`* Postnummer saknas`)
          .trim()
          .matches(/^(?=.*\d)[\d ]+$/)
          .withMessage(`* Endast heltal och mellanslag tillåtna under 'Postkod'`),
        body('city')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Postort saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ]+$/u)
          .withMessage(`* Endast bokstäver och mellanslag tillåtna under 'Postort'`),
        body('password')
          .trim()
          .not()
          .isEmpty()
          .withMessage('* Lösenord saknas')
          .isLength({ min: 6 })
          .withMessage('* Lösenordet måste vara minst 6 tecken'),
        body('confirmPassword')
          .not()
          .isEmpty()
          .withMessage('* Du måste bekräfta ditt lösenord')
          .trim()
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('* Lösenorden matchar inte');
            }
            return true;
          })
      ];
    }
    case 'postEmailInvoice':
    case 'postEditInvoice':
    case 'postSaveInvoice': {
      return [
        body('name')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Mottagare saknas`)
          .matches(/[0-9a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken under 'Mottagare'`),
        body('street')
          .not()
          .isEmpty()
          .withMessage(`* Gatuadress saknas`)
          .matches(/[0-9a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken under 'Gatuadress'`),
        body('city')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Postort saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Endast bokstäver tillåtna under 'Postort'`),
        body('invoiceNumber')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Fakturanummer saknas`)
          .isInt()
          .withMessage(`* Endast siffror tillåtna under 'Fakturanummer'`),
        body('description')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Beskrivning saknas`)
          .matches(/[0-9a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Endast bokstäver och siffror tillåtna under 'Beskrivning'`),
        body('quantity')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Antal saknas`)
          .isFloat()
          .withMessage(`* Endast siffror tillåtna under 'Antal'`),
        body('price')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Pris saknas`)
          .isFloat()
          .withMessage(`* Endast siffror tillåtna under 'Pris'`)
      ];
    }
    case 'postEditProfile': {
      return [
        body('name')
          .not()
          .isEmpty()
          .withMessage(`* Namn saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken i fältet 'Namn'`),
        body('company')
          .not()
          .isEmpty()
          .withMessage(`*Företagsnamn saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken i fältet 'Företagsnamn'`),
        body('wechatId')
          .not()
          .isEmpty()
          .withMessage(`* Wechat ID saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken i fältet 'Wechat ID'`),
        body('email')
          .isEmail()
          .withMessage('* Ange en giltig epostadress')
          .custom(async (email, { req }) => {
            try {
              const user = await User.findOne({ email });
              if (user.id !== req.user.id) {
                return Promise.reject('* Epostadressen existerar redan');
              }
              return true;
            } catch (e) {
              console.log(e);
            }
          })
          .normalizeEmail(),
        body('phone')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Telefonnummer saknas`)
          .matches(/^[0-9 .,+-]+$/i)
          .withMessage('* Ange ett giltigt telefonnummer'),
        body('street')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Gatuadress saknas`)
          .matches(/[0-9a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ,.'-]+$/u)
          .withMessage(`* Otillåtna tecken under 'Gatuadress'`),
        body('zip')
          .not()
          .isEmpty()
          .withMessage(`* Postnummer saknas`)
          .trim()
          .matches(/^(?=.*\d)[\d ]+$/)
          .withMessage(`* Endast heltal och mellanslag tillåtna under 'Postkod'`),
        body('city')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Postort saknas`)
          .matches(/[a-zA-ZàáäåèéüÀÁÄÅÒÓÖØÜ ]+$/u)
          .withMessage(`* Endast bokstäver och mellanslag tillåtna under 'Postort'`),
        body('registrationNumber')
          .trim()
          .not()
          .isEmpty()
          .withMessage(`* Organisationsnummer saknas`)
          .matches(/^([0-9]+-)*[0-9]+$/)
          .withMessage(`* Organisationsnumret skrivs i formatet 'NNNNNN-NNNN'`)
          .isLength({ min: 11, max: 11 })
          .withMessage(
            `* Organisationsnummer skrivs med 10 tecken separerat av ett bindestreck ('NNNNNN-NNNN')`
          ),
        body('password')
          .trim()
          .not()
          .isEmpty()
          .withMessage('* Lösenord saknas')
          .isLength({ min: 6 })
          .withMessage('* Lösenordet måste vara minst 6 tecken'),
        body('confirmPassword')
          .not()
          .isEmpty()
          .withMessage('* Du måste bekräfta ditt lösenord')
          .trim()
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              return Promise.reject('Lösenorden matchar inte');
            }
            return true;
          })
      ];
    }
    case 'postReset': {
      return [body('email').normalizeEmail()];
    }

    case 'postNewPassword': {
      return [
        body('password')
          .trim()
          .not()
          .isEmpty()
          .withMessage('* Lösenord saknas')
          .isLength({ min: 6 })
          .withMessage('* Lösenordet måste vara minst 6 tecken'),
        body('confirmPassword')
          .not()
          .isEmpty()
          .withMessage('* Du måste bekräfta ditt lösenord')
          .trim()
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              return Promise.reject('Lösenorden matchar inte');
            }
            return true;
          })
      ];
    }
  }
};

module.exports = validate;
