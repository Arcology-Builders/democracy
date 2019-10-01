declare namespace Transform {
  interface ITransform {
    inputTypes  : Immutable.List<[string,string]>
    outputTypes : Immutable.List<[string,string]>
    cacheable   : boolean
    func        : (args: any[]) => Immutable.Map<string,string>
    lang        : string
    compiler    : string
    version     : string
    contextMap  : { [key : string] : {
      packageName: string
      packageVersion: string
    } }
    toString    : () => string
    contentHash : Keccak256Hash
  }
}
