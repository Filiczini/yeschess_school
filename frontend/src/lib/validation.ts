export function required(value: string): string | null {
  return value.trim() ? null : 'Обовʼязкове поле'
}

export function email(value: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Некоректний email'
}

export function minLength(length: number) {
  return function (value: string): string | null {
    return value.length >= length ? null : `Мінімум ${length} символів`
  }
}

export function composeValidators(...validators: Array<(value: string) => string | null>) {
  return function (value: string): string | null {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}
