export function passwordValidationError(
  password: string
): string | null {
  if (
    password.length < 8 ||
    password.length > 72
  ) {
    return "A senha deve possuir entre 8 e 72 caracteres.";
  }

  if (/\s/.test(password)) {
    return "A senha não pode conter espaços.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve possuir pelo menos uma letra minúscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve possuir pelo menos uma letra maiúscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve possuir pelo menos um número.";
  }

  return null;
}