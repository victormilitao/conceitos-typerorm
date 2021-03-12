import { getRepository } from 'typeorm'
import AppError from '../errors/AppError'
import Transaction from '../models/Transaction'

class DeleteTransactionService {
  public async execute (id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction)

    const transaction = await transactionsRepository.findOne(id)

    if (transaction) {
      await transactionsRepository.remove(transaction)
    } else {
      throw new AppError('Transaction not exists')
    }
  }
}

export default DeleteTransactionService
