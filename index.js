import { faker } from '@faker-js/faker'
import mapObject, { mapObjectSkip } from 'map-obj'
import { createRequire } from 'node:module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)

function loadMock(path) {
  return require(`./__mocks__/get/${path}`)
}

function writeMock(path, data) {
  fs.writeFileSync(`./__faker-mocks__/get/${path}`, data)
}

function isPercentageLike(integer) {
  return integer === '0' || integer === '-0'
}

function isUserLike(key) {
  const userKeys = [
    'first_name',
    'last_name',
    'email',
    'mail',
    'username',
    'lastName',
    'lastName',
    'displayName',
    'givenName',
    'surname',
    'userPrincipalName',
    'pic',
  ]

  return !!userKeys.find((k) => key?.toLowerCase()?.includes(k.toLowerCase()))
}

function getAllMocks(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllMocks(`${dirPath}/${file}`, arrayOfFiles)
    } else {
      arrayOfFiles.push(`${dirPath}/${file}`)
    }
  })

  return arrayOfFiles
}

function updateMock(mockPath) {
  let mock = loadMock(mockPath)

  if (Array.isArray(mock)) {
    mock = { data: mock }
  }

  const skipKeys = ['id', 'name', 'year', 'month', 'date', 'site', 'plant']
  const skipValues = [0, 1, 2, 3, null]

  const mapper = (key, value) => {
    if (skipKeys.includes(key) || skipValues.includes(value)) return [key, value]

    if (isUserLike(key)) {
      if (typeof value === 'string' && value.includes('@')) {
        return [key, faker.internet.email()]
      }

      return [key, faker.name.fullName()]
    }

    if (typeof value === 'number') {
      const valueString = String(value)
      const [integer, decimal] = valueString.split('.')
      let fakeInteger = '0'
      let fakeDecimal = '0'

      if (isPercentageLike(integer)) {
        fakeInteger = integer
      } else if (integer.startsWith('-')) {
        fakeInteger = -faker.random.numeric(integer.length - 1)
      } else {
        fakeInteger = faker.random.numeric(integer.length)
      }

      if (typeof decimal === 'string') {
        fakeDecimal = `.${faker.random.numeric(decimal.length)}`
      } else {
        fakeDecimal = ''
      }

      const nextValue = Number(`${fakeInteger}${fakeDecimal}`)
      return [key, nextValue]
    }

    return [key, value]
  }

  const result = mapObject(mock, mapper, { deep: true })
  writeMock(mockPath, JSON.stringify(result, null, 2))
}

getAllMocks('./__mocks__/get').forEach((mockPath) => {
  updateMock(mockPath.replace('./__mocks__/get/', ''))
})
