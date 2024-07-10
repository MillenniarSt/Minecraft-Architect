String resourceDir = "todo";
String dataDir = "todo";

File resourceFile(String dir, String location) => File("$resourceDir/assets/$dir/${location.contains(":") ? location.substring(0, location.indexOf(":")) : "minecraft"}/${location.contains(":") ? location.substring(location.indexOf(":") +1) : location}");

class Texture implements JsonMappable<String, dynamic> {

  late File file;
  late List<int> uv;
  late int? tint;

  Texture(this.file, {this.uv = const [0, 0, 16, 16], this.tint});
  
  Texture.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Texture.resource(Map<String, dynamic> json) {
    resource(json);
  }

  void json(Map<String, dynamic> json) {
    file = File(json["file"]);
    uv = List.of(json["uv"]);
    tint = json["tint"];
  }

  Map<String, dynamic> toJson() => {
    "file": file.path,
    "uv": uv,
    if(tint != null) "tint": tint
  };

  void resource(Map<String, dynamic> json) {
    file = resourceFile("textures", json["texture"]);
    uv = json["uv"];
    tint = json["tintIndex"];
  }
}