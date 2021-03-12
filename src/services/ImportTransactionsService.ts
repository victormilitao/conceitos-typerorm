import csvParse from 'csv-parse'
import fs from 'fs'
import { getRepository, In } from 'typeorm'
import Category from '../models/Category'
import Transaction from '../models/Transaction'

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute (filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction)
    const categoriesRepository = getRepository(Category)

    const readCSVStream = fs.createReadStream(filePath)

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true
    })

    const parseCSV = readCSVStream.pipe(parseStream)

    const transactions: CSVTransaction[] = []
    const categories: string[] = []

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line

      if (!title || !type || !value) return

      categories.push(category)
      transactions.push({ title, type, value, category })
    })

    await new Promise(resolve => {
      parseCSV.on('end', resolve)
    })

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) }
    })

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title
    )

    const addCategoryTitles = Array.from(
      new Set(categories.filter(category => !existentCategoriesTitles.includes(category)))
    )

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title
      }))
    )

    await categoriesRepository.save(newCategories)

    const finalCategories = [...newCategories, ...existentCategories]

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category
        )
      }))
    )

    await transactionsRepository.save(createdTransactions)

    await fs.promises.unlink(filePath)

    return createdTransactions
  }
}

// const csvFilePath = path.resolve(__dirname, '../../tmp/import_template.csv')

// const data = await loadCSV(csvFilePath)

// const createTransaction = new CreateTransactionService()

// let transactions<Transaction[]> = []
// data.forEach(transaction => {
//   transactions.concat(await createTransaction.execute({ transaction.title, transaction.value, transaction.type, categoryName: transaction.category }))
// });

// return transactions

export default ImportTransactionsService
