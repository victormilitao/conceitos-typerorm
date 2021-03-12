import AppError from '../errors/AppError'

import { getRepository, getCustomRepository } from 'typeorm'
import Category from '../models/Category'
import Transaction from '../models/Transaction'
import TransactionsRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute ({ title, value, type, categoryName }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    const categoriesRepository = getRepository(Category)

    const { total } = await transactionsRepository.getBalance()

    if (type === 'outcome' && value > total) {
      throw new AppError('Insufficient balance')
    }

    let category = await categoriesRepository.findOne({ where: { title: categoryName } })
    if (!category) {
      category = categoriesRepository.create({ title: categoryName })
      await categoriesRepository.save(category)
    }

    const transaction = transactionsRepository.create({
      title, value, type, category: category
    })

    await transactionsRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService
