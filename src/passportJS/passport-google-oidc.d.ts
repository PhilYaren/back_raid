declare module 'passport-google-oidc' {
    import { Strategy } from 'passport';
  
    interface IProfile {
      // здесь перечисляются поля профиля, которые возвращает Google OIDC
    id: any;
    displayName:any;
    email: any;
    }
  
    interface IVerifyOptions {
      // здесь перечисляются опции, которые могут быть переданы в метод verify
    }
  
    interface IStrategyOptions {
      // здесь перечисляются опции, которые могут быть переданы в конструктор Strategy
    }
  
    class Strategy implements Strategy {
      constructor(options: IStrategyOptions, verify: (issuer:any, profile: IProfile, done: (error: any, user?: any, options?: IVerifyOptions) => void) => void);
      name: string;
      authenticate(req: any, options?: Object): void;
    }
  }