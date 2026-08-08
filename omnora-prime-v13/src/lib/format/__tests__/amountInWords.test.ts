import { describe, test, expect } from 'vitest'
import {
  amountInWordsEnglish,
  amountInWordsDirhams,
} from '../amountInWords'

describe('Amount in Words', () => {
  test('PKR 45,000', () => {
    expect(amountInWordsEnglish(45000, 'PKR'))
      .toBe('PKR Forty Five Thousand Only')
  })
  test('PKR 0', () => {
    expect(amountInWordsEnglish(0, 'PKR'))
      .toBe('PKR Zero Only')
  })
  test('AED 1234.50', () => {
    expect(amountInWordsDirhams(1234.50))
      .toBe('AED One Thousand Two Hundred Thirty Four and Fifty Fils Only')
  })
  test('PKR 12,50,000', () => {
    expect(amountInWordsEnglish(1250000, 'PKR'))
      .toBe('PKR Twelve Lakh Fifty Thousand Only')
  })
})
