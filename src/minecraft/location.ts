export class Location {

    static readonly UNDEFINED = new Location('beaver', 'undefined')
  
    constructor(readonly mod: string, readonly id: string) { }
  
    static minecraft(id: string): Location {
      return new Location('minecraft', id)
    }
  
    static fromJson(json: string): Location {
      return new Location(
        json.includes(':') ? json.substring(0, json.indexOf(':')) : 'minecraft',
        json.includes(':') ? json.substring(json.indexOf(':') + 1) : json
      )
    }
  
    toJson(): string {
      return `${this.mod}:${this.id}`
    }
  
    equals(other: Location): boolean {
      return this.mod == other.mod && this.id == other.id
    }
  
    toString(): string {
      return this.toJson()
    }
  
    toDir(): string {
      return `${this.mod}/${this.id}`
    }
  }