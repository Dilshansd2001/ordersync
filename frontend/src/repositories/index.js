import { getRuntimeMode } from '@/platform/runtime'
import { createDesktopCustomersRepository } from './customers/customersRepository.desktop'
import { createHttpCustomersRepository } from './customers/customersRepository.http'
import { createDesktopExpensesRepository } from './expenses/expensesRepository.desktop'
import { createHttpExpensesRepository } from './expenses/expensesRepository.http'
import { createDesktopOrdersRepository } from './orders/ordersRepository.desktop'
import { createHttpOrdersRepository } from './orders/ordersRepository.http'
import { createDesktopProductsRepository } from './products/productsRepository.desktop'
import { createHttpProductsRepository } from './products/productsRepository.http'
import { createDesktopSyncRepository } from './sync/syncRepository.desktop'
import { createHttpSyncRepository } from './sync/syncRepository.http'

export const repositories = {
  orders:
    getRuntimeMode() === 'desktop'
      ? createDesktopOrdersRepository()
      : createHttpOrdersRepository(),
  products:
    getRuntimeMode() === 'desktop'
      ? createDesktopProductsRepository()
      : createHttpProductsRepository(),
  customers:
    getRuntimeMode() === 'desktop'
      ? createDesktopCustomersRepository()
      : createHttpCustomersRepository(),
  expenses:
    getRuntimeMode() === 'desktop'
      ? createDesktopExpensesRepository()
      : createHttpExpensesRepository(),
  sync:
    getRuntimeMode() === 'desktop'
      ? createDesktopSyncRepository()
      : createHttpSyncRepository(),
}
