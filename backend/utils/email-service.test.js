const axios = require('axios');
const format = require('date-fns/format');
const addMinutes = require('date-fns/addMinutes');
const emailService = require('./email-service');

const defaultEnv = process.env;

jest.mock('axios');

const generateTestPersonalisation = ({ now, numOfSlots, merchant, address, url, showMore }) => {
  const slots = [];

  console.log('numOfSlots is:', numOfSlots);

  for (let i = 0; i < numOfSlots; i++) {
    slots.push({
      formattedDate: format(now, 'EEEE, do LLLL'),
      startTime: format(now, 'k:mm'),
      endTime: format(addMinutes(now, 30), 'k:mm'),
      price: '£1.50'
    });
  }

  return {
    to: [{ email: address }],
    dynamic_template_data: {
      more: showMore,
      'btn-link': url,
      merchant,
      slots
    }
  }
};

describe('emailService', () => {

  describe('.build()', () => {
    test('returns object in the correct format with one addressee', () => {
      const now = new Date();
      const url = 'https://google.com';
      const merchant = 'asda';
      const addresses = ['lincoln.kaneadam@gmail.com'];
      const slots = [
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' }
      ];

      const personalization1 = generateTestPersonalisation({ now, merchant: 'Asda', numOfSlots: 2, address: addresses[0], url, showMore: false });
      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [personalization1]
      };

      const returnedObj = emailService.build(merchant, slots, addresses, url);
      expect(returnedObj).toEqual(expectedObj);
    });

    test('returns object in the correct format with >one addressee', () => {
      const now = new Date();
      const merchant = 'asda';
      const url = 'https://google.com';
      const addresses = ['lincoln.kaneadam@gmail.com', 'kane.lincoln@icloud.com'];
      const slots = [
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' }
      ];

      const personalization1 = generateTestPersonalisation({ now, merchant: 'Asda', numOfSlots: 2, address: addresses[0], url, showMore: false });
      const personalization2 = generateTestPersonalisation({ now, merchant: 'Asda', numOfSlots: 2, address: addresses[1], url, showMore: false });
      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [
          personalization1,
          personalization2
        ]
      };

      const returnedObj = emailService.build(merchant, slots, addresses, url);
      expect(returnedObj).toEqual(expectedObj);
    });

    test('returns only 5 slots if there are more than 5 slots available', () => {
      const now = new Date();
      const merchant = 'asda';
      const url = 'https://google.com';
      const addresses = ['lincoln.kaneadam@gmail.com', 'kane.lincoln@icloud.com'];
      const slots = [ // 9 slots here.
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
        { date: now, start: now, end: addMinutes(now, 30), price: '£1.50' },
      ];

      const personalization1 = generateTestPersonalisation({ now, merchant: 'Asda', numOfSlots: 5, address: addresses[0], url, showMore: true });
      const personalization2 = generateTestPersonalisation({ now, merchant: 'Asda', numOfSlots: 5, address: addresses[1], url, showMore: true });
      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [
          personalization1,
          personalization2
        ] 
      };

      const returnedObj = emailService.build(merchant, slots, addresses, url);
      expect(returnedObj.personalizations[0].dynamic_template_data.slots.length).toEqual(5); // Super-clear check for Karan ;)
      expect(returnedObj).toEqual(expectedObj);
    });
  });

  describe('.send()', () => {
    xdescribe('process.env.SENDGRID_API_KEY does not exist', () => {
      test('Returns a 400 Bad Request if process.env.SENDGRID_API_KEY does not exist', async () => {
        const response = await emailService.send({});
        expect(response.statusCode).toBe(400);
      });
    });

    describe('process.env.PERSONAL_EMAIL = "kane@test.com"', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env = {
          ...defaultEnv,
          PERSONAL_EMAIL: 'kane@test.com',
          SENDGRID_API_KEY: 'test-api-key'
        };
      });

      afterEach(() => {
        process.env = defaultEnv;
      });

      test('Returns a 400 Bad Request if no data is passed', async () => {
        const response = await emailService.send();
        expect(response.statusCode).toBe(400);
      });

      test('Returns a 400 Bad Request if empty object is passed', async () => {
        const response = await emailService.send({});
        expect(response.statusCode).toBe(400);
      });

      test('Returns a 400 Bad Request if merchant is not passed', async () => {
        const response = await emailService.send({ merchant: undefined, slots: [{}] });
        expect(response.statusCode).toBe(400);
      });

      test('Returns a 400 Bad Request if slots is not passed', async () => {
        const response = await emailService.send({ merchant: 'amazon', slots: undefined });
        expect(response.statusCode).toBe(400);
      });

      test('Returns a 200 OK if all required args are passed', async () => {
        const now = new Date;
        const slots = [
          {
            date: now,
            start: now,
            end: addMinutes(now, 30),
            price: '£1.00'
          }
        ];

        axios.mockImplementationOnce(() => Promise.resolve({}));
        const response = await emailService.send({ merchant: 'amazon', slots, url: 'https://google.com' });

        expect(axios).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
      });
    });

    describe('process.env.PERSONAL_EMAIL is undefined', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env = {
          ...defaultEnv,
          SENDGRID_API_KEY: 'test-api-key'
        };
      });

      afterEach(() => {
        process.env = defaultEnv;
      });

      test('Returns a 400 Bad Request if no addresses are found', async () => {
        const response = await emailService.send({ merchant: 'amazon', slots: [{}] });
        expect(response.statusCode).toBe(400);
      });

      test('Returns a 200 OK if addresses are found', async () => {
        const merchant = 'asda';
        const addresses = ['nice_guy_curtis@test.com', 'nicer_guy_karan@test.com' ];
        const now = new Date;
        const slots = [
          {
            date: now,
            start: now,
            end: addMinutes(now, 30),
            price: '£1.00'
          }
        ];

        axios.mockImplementationOnce(() => Promise.resolve({}));
        const response = await emailService.send({ merchant, slots, addresses, url: 'https://google.com' });

        expect(axios).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
      });
    });
  });

});
