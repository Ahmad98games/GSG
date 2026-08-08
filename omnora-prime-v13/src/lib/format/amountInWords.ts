const ONES_EN = [
  '', 'One', 'Two', 'Three', 'Four',
  'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen',
  'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const TENS_EN = [
  '', '', 'Twenty', 'Thirty', 'Forty',
  'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
]

const ONES_UR = [
  '', 'ایک', 'دو', 'تین', 'چار',
  'پانچ', 'چھ', 'سات', 'آٹھ', 'نو',
  'دس', 'گیارہ', 'بارہ', 'تیرہ', 'چودہ',
  'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
]

const TENS_UR = [
  '', '', 'بیس', 'تیس', 'چالیس',
  'پچاس', 'ساٹھ', 'ستر', 'اسّی', 'نوے',
]

function convertHundredsEN(n: number): string {
  if (n === 0) return ''
  let result = ''
  if (n >= 100) {
    result += ONES_EN[Math.floor(n / 100)] + ' Hundred '
    n = n % 100
  }
  if (n >= 20) {
    result += TENS_EN[Math.floor(n / 10)]
    if (n % 10 !== 0) {
      result += ' ' + ONES_EN[n % 10]
    }
  } else if (n > 0) {
    result += ONES_EN[n]
  }
  return result.trim()
}

function convertHundredsUR(n: number): string {
  if (n === 0) return ''
  let result = ''
  if (n >= 100) {
    result += ONES_UR[Math.floor(n / 100)] + ' سو '
    n = n % 100
  }
  if (n >= 20) {
    result += TENS_UR[Math.floor(n / 10)]
    if (n % 10 !== 0) {
      result += ' ' + ONES_UR[n % 10]
    }
  } else if (n > 0) {
    result += ONES_UR[n]
  }
  return result.trim()
}

export function amountInWordsEnglish(
  amount: number,
  currency: string = 'PKR'
): string {
  if (amount === 0)
    return `${currency} Zero Only`

  const isNegative = amount < 0
  amount = Math.abs(Math.round(amount))

  const crore = Math.floor(amount / 10000000)
  const lakh = Math.floor(
    (amount % 10000000) / 100000
  )
  const thousand = Math.floor(
    (amount % 100000) / 1000
  )
  const hundred = Math.floor(
    (amount % 1000) / 100
  )
  const remainder = amount % 100

  let words = ''

  if (crore > 0) {
    words += convertHundredsEN(crore) + ' Crore '
  }
  if (lakh > 0) {
    words += convertHundredsEN(lakh) + ' Lakh '
  }
  if (thousand > 0) {
    words += convertHundredsEN(thousand) + ' Thousand '
  }
  if (hundred > 0) {
    words += ONES_EN[hundred] + ' Hundred '
  }
  if (remainder > 0) {
    if (hundred > 0 || thousand > 0 || lakh > 0 || crore > 0) {
      words += 'and '
    }
    if (remainder < 20) {
      words += ONES_EN[remainder]
    } else {
      words += TENS_EN[Math.floor(remainder / 10)]
      if (remainder % 10 !== 0) {
        words += ' ' + ONES_EN[remainder % 10]
      }
    }
  }

  const prefix = isNegative ? 'Minus ' : ''
  return `${currency} ${prefix}${words.trim()} Only`
}

export function amountInWordsUrdu(
  amount: number,
  currency: string = 'روپے'
): string {
  if (amount === 0)
    return `${currency} صفر`

  amount = Math.abs(Math.round(amount))

  const crore = Math.floor(amount / 10000000)
  const lakh = Math.floor(
    (amount % 10000000) / 100000
  )
  const thousand = Math.floor(
    (amount % 100000) / 1000
  )
  const remainder = amount % 1000

  let words = ''

  if (crore > 0) {
    words += convertHundredsUR(crore) + ' کروڑ '
  }
  if (lakh > 0) {
    words += convertHundredsUR(lakh) + ' لاکھ '
  }
  if (thousand > 0) {
    words += convertHundredsUR(thousand) + ' ہزار '
  }
  if (remainder > 0) {
    words += convertHundredsUR(remainder)
  }

  return `${currency} ${words.trim()} صرف`
}

// UAE Dirhams and Fils
export function amountInWordsDirhams(
  amount: number
): string {
  const dirhams = Math.floor(amount)
  const fils = Math.round((amount - dirhams) * 100)

  let words = amountInWordsEnglish(
    dirhams, 'AED'
  ).replace(' Only', '')

  if (fils > 0) {
    words += ` and ${convertHundredsEN(fils)} Fils`
  }

  return words + ' Only'
}

export function getAmountInWords(
  amount: number,
  currency: string,
  language: 'en' | 'ur' = 'en'
): string {
  if (language === 'ur') {
    const currencyUrdu =
      currency === 'PKR' ? 'روپے'
      : currency === 'AED' ? 'درہم'
      : currency
    return amountInWordsUrdu(amount, currencyUrdu)
  }

  if (currency === 'AED') {
    return amountInWordsDirhams(amount)
  }

  return amountInWordsEnglish(amount, currency)
}
