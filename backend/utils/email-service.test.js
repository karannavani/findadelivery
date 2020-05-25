const emailService = require('./email-service');
const axios = require('axios');
const format = require('date-fns/format');
const addMinutes = require('date-fns/addMinutes');
const defaultEnv = process.env;

jest.mock('axios');

describe('emailService', () => {

  describe('.build()', () => {
    test('returns object in the correct format with one addressee', () => {
      const now = new Date();
      const merchant = 'asda';
      const addresses = ['lincoln.kaneadam@gmail.com'];
      const slots = [
        { date: now, start: now, end: addMinutes(now, 30), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' } // An hour after the previous slot
      ];

      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [{
          to: [{ email: 'lincoln.kaneadam@gmail.com' }],
          dynamic_template_data: {
            'btn-link': 'https://google.com',
            merchant: 'Asda', // I didn't use the merchant var here to make our expectations SUPER clear.
            slots: [
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(now, 'k:mm'),
                endTime: format(addMinutes(now, 30), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
            ]
          }
        }]
      };

      const returnedObj = emailService.build(merchant, addresses, slots);
      expect(returnedObj).toEqual(expectedObj);
    });
    
    test('returns object in the correct format with >one addressee', () => {
      const now = new Date();
      const merchant = 'asda';
      const addresses = ['lincoln.kaneadam@gmail.com', 'kane.lincoln@icloud.com'];
      const slots = [
        { date: now, start: now, end: addMinutes(now, 30), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' } // An hour after the previous slot
      ];

      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [{
          to: [
            { email: 'lincoln.kaneadam@gmail.com' },
            { email: 'kane.lincoln@icloud.com' },
          ],
          dynamic_template_data: {
            'btn-link': 'https://google.com',
            merchant: 'Asda',
            slots: [
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(now, 'k:mm'),
                endTime: format(addMinutes(now, 30), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
            ]
          }
        }]
      };

      const returnedObj = emailService.build(merchant, addresses, slots);
      expect(returnedObj).toEqual(expectedObj);
    });

    test('returns only 6 slots if there are more than 6 slots available', () => {
      const now = new Date();
      const merchant = 'asda';
      const addresses = ['lincoln.kaneadam@gmail.com', 'kane.lincoln@icloud.com'];
      const slots = [ // 9 slots here.
        { date: now, start: now, end: addMinutes(now, 30), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' }, // An hour after the previous slot
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' }, 
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' },
        { date: now, start: addMinutes(now, 60), end: addMinutes(now, 90), url: 'https://google.com', price: '£1.50' }
      ];

      const expectedObj = {
        from: { email: 'noreply@findadelivery.com' },
        template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
        personalizations: [{
          to: [
            { email: 'lincoln.kaneadam@gmail.com' },
            { email: 'kane.lincoln@icloud.com' },
          ],
          dynamic_template_data: {
            'btn-link': 'https://google.com',
            merchant: 'Asda',
            slots: [ // 6 slots here.
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(now, 'k:mm'),
                endTime: format(addMinutes(now, 30), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              },
              {
                formattedDate: format(now, 'EEEE, do LLLL'),
                startTime: format(addMinutes(now, 60), 'k:mm'),
                endTime: format(addMinutes(now, 90), 'k:mm'),
                price: '£1.50'
              }
            ]
          }
        }]
      };

      const returnedObj = emailService.build(merchant, addresses, slots);
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
        const response = await emailService.send({ merchant: 'amazon', slots });

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
        const response = await emailService.send({ merchant, slots, addresses });

        expect(axios).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
      });
    });
  });

});

