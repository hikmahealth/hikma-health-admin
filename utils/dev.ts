// import { faker } from '@faker-js/faker';
// import { format } from 'date-fns';

// /**
//  * If in dev mode, generate a random patient using the base fields and return it.
//  * If not in dev mode, return null.
//  */
// export function generateRandomPatient(): Partial<Patient> | null {
//     if (process.env.NODE_ENV === 'development') {
//         return {
//             given_name: faker.person.firstName(),
//             surname: faker.person.lastName(),
//             date_of_birth: format(faker.date.past(), 'yyyy-MM-dd'),
//             sex: faker.person.sex(),
//             country: faker.location.country(),
//             hometown: faker.location.city(),
//             phone: faker.phone.number(),
//             camp: faker.company.name(),
//             id: faker.string.uuid(),
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             additional_data: [],

//         };
//     }
//     return null;
// }
