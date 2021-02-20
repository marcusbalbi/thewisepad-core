import { UseCase } from '@/use-cases/ports'
import { HttpRequest, HttpResponse, WebController } from '@/presentation/controllers/ports'
import { badRequest, forbidden, getMissingParams, ok, serverError } from '@/presentation/controllers/util'
import { MissingParamError } from '@/presentation/controllers/errors'
import { Either } from '@/shared'
import { UserNotFoundError, WrongPasswordError } from '@/use-cases/authentication/errors'
import { AuthenticationResult } from '@/use-cases/authentication/ports'

export class SignInController implements WebController {
  protected readonly signInUseCase: UseCase

  constructor (signInUseCase: UseCase) {
    this.signInUseCase = signInUseCase
  }

  async handle (request: HttpRequest): Promise<HttpResponse> {
    try {
      const requiredParams = ['email', 'password']
      const missingParams: string[] = getMissingParams(request, requiredParams)
      if (missingParams.length > 0) {
        return badRequest(new MissingParamError(missingParams.join(', ')))
      }

      const response: Either<UserNotFoundError | WrongPasswordError, AuthenticationResult> =
        await this.signInUseCase.perform({ email: request.body.email, password: request.body.password })

      if (response.isRight()) {
        return ok(response.value)
      }

      if (response.value instanceof WrongPasswordError) {
        return forbidden(response.value)
      }

      return badRequest(response.value)
    } catch (error) {
      return serverError(error)
    }
  }
}
