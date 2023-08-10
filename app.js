const fs = require('fs')

// Items per file
const itemLimit = 5

// Get CSV data
function getDataFromCsv() {
  const csvData = fs.readFileSync('data.csv', 'utf-8').replace(/\r/g, '')
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',')
  
  const data = new Map()

  for (header of headers) {
      const values = extractColumnValues(csvData, header)
      data.set(header, values)
  }

  return data
}

// Get column values from CSV data
function extractColumnValues(csvContent, columnName) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')
  const columnIndex = headers.indexOf(columnName)

  if (columnIndex === -1) {
    throw new Error(`Column "${columnName}" not found.`)
  }

  const columnValues = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length > columnIndex) {
      columnValues.push(values[columnIndex])
    }
  }

  return columnValues
}

function getDataFrom(csvData, start = 0, stop = 0) {

    const data = new Map()

    for (key of csvData.keys()) {
        const array = []

        for (let i = start; i < Math.min(stop, csvData.get(key).length); i++) {
            array.push(csvData.get(key)[i])
        }

        data.set(key, array)
    }

    return data
}

function writeTemplates(data) {

    const firstKey = data.keys().next().value
    const numRows = data.get(firstKey).length - 1
    const numFiles = Math.ceil(numRows / itemLimit)

    const template = fs.readFileSync('template.sql', 'utf-8')

    console.log(`Processing ${numRows} rows in ${numFiles} files`)

    for (let fileIndex = 0; fileIndex < numFiles; fileIndex++) {
        const start = fileIndex * itemLimit
        const end = start + itemLimit

        console.log(`Processing rows ${start} to ${end}`)
        const dataChunk = getDataFrom(data, start, end)

        writeTemplate(dataChunk, template, fileIndex)
    }
}

function writeTemplate(dataChunk, template, fileIndex) {
  
  var output = template

  for (key of dataChunk.keys()) {
    const placeholder = `{{${key}}}`
    const value = dataChunk.get(key).join(',')
    output = output.replace(new RegExp(placeholder, 'g'), value)
  }

  const outputFile = `${fileIndex + 1}_Insert_IpcData.sql`
  fs.writeFileSync(outputFile, output)
  console.log(`Exported ${outputFile}`)
}

function main() {

    const data = getDataFromCsv()
    writeTemplates(data)
}

main()
