export const workerTerms: Record<string, {
  worker: string
  workers: string
  advance: string
  payroll: string
  attendance: string
  production: string
}> = {
  karigar: {   // Pakistan, India traditional
    worker: 'Karigar',
    workers: 'Karigars',
    advance: 'Peshgi',
    payroll: 'Payroll',
    attendance: 'Haazri',
    production: 'Piece Entry'
  },
  worker: {    // International default
    worker: 'Worker',
    workers: 'Workers',
    advance: 'Advance',
    payroll: 'Payroll',
    attendance: 'Attendance',
    production: 'Production Log'
  },
  operator: {  // Manufacturing/industrial
    worker: 'Operator',
    workers: 'Operators',
    advance: 'Salary Advance',
    payroll: 'Payroll',
    attendance: 'Attendance',
    production: 'Output Log'
  },
  artisan: {   // Craft/luxury
    worker: 'Artisan',
    workers: 'Artisans',
    advance: 'Advance',
    payroll: 'Compensation',
    attendance: 'Attendance',
    production: 'Craft Log'
  },
  tailor: {    // Garment specific
    worker: 'Tailor',
    workers: 'Tailors',
    advance: 'Advance',
    payroll: 'Wages',
    attendance: 'Attendance',
    production: 'Stitch Count'
  },
  employee: {  // Office/formal
    worker: 'Employee',
    workers: 'Employees',
    advance: 'Salary Advance',
    payroll: 'Salary',
    attendance: 'Attendance',
    production: 'Output'
  }
}

export function getWorkerTerms(term: string) {
  return workerTerms[term] || workerTerms.worker
}
