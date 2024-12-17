const baseDate = new Date();
const dateMinusOne = new Date(baseDate).setDate(baseDate.getDate() - 1);
const dateMinusTwo = new Date(baseDate).setDate(baseDate.getDate() - 2);
const dateMinusThree = new Date(baseDate).setDate(baseDate.getDate() - 3);

const patientData = [
	{
		firstName: 'Maureene',
		lastName: 'Dulinty',
		mrn: '6947012287',
		gender: 'Female',
		dateOfBirth: '5/1/1946',
		age: 78,
		vitalSigns: [
			{
				date: dateMinusOne,
				bp: {
					sys: 100,
					dia: 60,
				},
				temp: 90,
				pulse: 40,
				o2: 90,
				resp: 10,
				pain: 4,
				height: 60,
				weight: 150,
			},
			{
				date: dateMinusTwo,
				bp: {
					sys: 110,
					dia: 70,
				},
				temp: 93,
				pulse: 43,
				o2: 93,
				resp: 13,
				pain: 5,
				height: 61,
				weight: 155,
			},
			{
				date: dateMinusThree,
				bp: {
					sys: 120,
					dia: 80,
				},
				temp: 96,
				pulse: 46,
				o2: 96,
				resp: 16,
				pain: 6,
				height: 60,
				weight: 160,
			},
		],
	},
	{
		firstName: 'Lindie',
		lastName: 'Keepe',
		mrn: '0189267798',
		gender: 'Female',
		dateOfBirth: '10/28/1933',
		age: 91,
	},
	{
		firstName: 'Antonella',
		lastName: 'McCurry',
		mrn: '8748056995',
		gender: 'Male',
		dateOfBirth: '6/7/1949',
		age: 75,
	},
	{
		firstName: 'Sayre',
		lastName: 'Feaster',
		mrn: '9347946753',
		gender: 'Male',
		dateOfBirth: '11/23/1936',
		age: 88,
	},
	{
		firstName: 'Dina',
		lastName: 'Lucas',
		mrn: '7208551979',
		gender: 'Female',
		dateOfBirth: '11/6/1938',
		age: 86,
	},
	{
		firstName: 'Conn',
		lastName: 'Sheal',
		mrn: '4611028917',
		gender: 'Male',
		dateOfBirth: '9/19/1934',
		age: 90,
	},
	{
		firstName: 'Blakeley',
		lastName: 'Gurney',
		mrn: '2385707373',
		gender: 'Female',
		dateOfBirth: '9/22/1931',
		age: 93,
	},
	{
		firstName: 'Sharla',
		lastName: 'Dashwood',
		mrn: '1567391443',
		gender: 'Female',
		dateOfBirth: '1/22/1958',
		age: 66,
	},
	{
		firstName: 'Derk',
		lastName: 'Galley',
		mrn: '5705674619',
		gender: 'Male',
		dateOfBirth: '3/1/1950',
		age: 74,
	},
	{
		firstName: 'Gayle',
		lastName: 'Worcs',
		mrn: '2496219881',
		gender: 'Female',
		dateOfBirth: '6/7/1955',
		age: 69,
	},
];

const patientService = {
	getPatient: fetchPatient,
	saveData: storeData,
	getData: fetchData,
};

/**
 * Find, and return, the patient from the mock patients list with a matching MRN.
 *
 * @param {String} mrn The patient's Medical Record Number (MRN)
 * @returns The patient, or undefined if a matching patient is not found
 */
function fetchPatient(mrn) {
	return patientData.find((p) => p.mrn === mrn);
}

/**
 * Store a key/value pair in local storage.
 * The value is expected to be a valid JSON object.
 *
 * @param {String} key The storage key
 * @param {JSON} value The JSON object to store
 */
function storeData(key, json) {
	localStorage.setItem(key, JSON.stringify(json));
}

/**
 * Retrieve a stored object from local storage.
 *
 * @param {String} key
 * @returns The stored data, parsed as JSON, or null if no data is found
 */
function fetchData(key) {
	const data = localStorage.getItem(key);
	if (data) {
		return JSON.parse(data);
	}
	return null;
}
