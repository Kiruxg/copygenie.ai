// Custom error classes for different authentication scenarios
class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

class ValidationError extends AuthError {
  constructor(message, fields) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.fields = fields;
  }
}

// Error handler class
class AuthErrorHandler {
  static handleError(error, formElement) {
    // Clear previous errors
    this.clearErrors(formElement);

    if (error instanceof ValidationError) {
      this.handleValidationError(error, formElement);
    } else if (error instanceof AuthError) {
      this.handleAuthError(error, formElement);
    } else {
      this.handleGenericError(error, formElement);
    }
  }

  static clearErrors(formElement) {
    // Remove all error messages
    const existingErrors = formElement.querySelectorAll(".error-message");
    existingErrors.forEach((error) => error.remove());

    // Remove error classes from inputs
    const inputs = formElement.querySelectorAll(".error");
    inputs.forEach((input) => input.classList.remove("error"));
  }

  static handleValidationError(error, formElement) {
    error.fields.forEach((field) => {
      const input = formElement.querySelector(`[name="${field.name}"]`);
      if (input) {
        input.classList.add("error");
        this.showErrorMessage(input, field.message);
      }
    });
  }

  static handleAuthError(error, formElement) {
    switch (error.code) {
      case "INVALID_CREDENTIALS":
        this.showFormError(formElement, "Invalid email or password");
        break;
      case "EMAIL_EXISTS":
        this.showFormError(formElement, "Email already registered");
        break;
      case "ACCOUNT_LOCKED":
        this.showFormError(
          formElement,
          "Account locked. Please contact support"
        );
        break;
      case "EMAIL_NOT_VERIFIED":
        this.showFormError(formElement, "Please verify your email first");
        break;
      default:
        this.showFormError(formElement, error.message);
    }
  }

  static handleGenericError(error, formElement) {
    this.showFormError(
      formElement,
      "An unexpected error occurred. Please try again later."
    );
    console.error("Authentication error:", error);
  }

  static showErrorMessage(element, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    element.parentNode.insertBefore(errorDiv, element.nextSibling);
  }

  static showFormError(formElement, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "form-error-message";
    errorDiv.textContent = message;
    formElement.insertBefore(errorDiv, formElement.firstChild);
  }
}
