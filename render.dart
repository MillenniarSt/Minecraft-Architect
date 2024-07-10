String resourceDir = "todo";
String dataDir = "todo";

String resourcePath(String dir, String location) => 
"$dir/${location.contains(":") ? location.substring(0, location.indexOf(":")) : "minecraft"}/${location.contains(":") ? location.substring(location.indexOf(":") +1) : location}";

File resourceFile(String dir, String location) => 
File("$resourceDir/assets/${resourcePath(dir, location)}");

File dataFile(String dir, String location) => 
File("$dataDir/${resourcePath(dir, location)}");

class Cube implements JsonMappable<Map<String, dynamic>> {

  Pos3D? pivot;
  Rotation3D? rotation;
  late Dimension dimension;
  late Map<String, Texture> faces;

  Cube({this.pivot, this.rotation, required this.dimension, this.faces = const {}});

  BlockCube.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Cube.resource(Map<String, dynamic> json,   Map<String, String> textures) {
    resource(json, textures);
  }

  void json(Map<String, dynamic> json) {
    pivot = Pos3D.json(json["pivot"]?);
    rotation = Rotation3D.json(json["rotation"]?);
    dimension = Dimensione.json(json["dimension"]);
    textures = {
      for(String face in json["faces"])
        face: Texture.json(json["faces"][face])
    };
  }

  Map<String, dynamic> toJson() => {
    if(pivot != null) "pivot": pivot.toJson(),
    if(rotation != null) "rotation": rotation.toJson(),
    "dimension": dimension.toJson(),
    "faces": {
      for(String face in faces)
        face: faces[face]!.toJson()
    }
  };

  void resource(Map<String, dynamic> json, Map<String, String> textures) {
    if(json.contains("rotation") {
      pivot = Pos3D.json(json["rotation"]["origin"]);
      rotation = Rotation3D.axis(Axis.parse(json["rotation"]["axis"])!, json["rotation"]["angle"]);
    }
    dimension = Dimensione.poss(Pos3D.json(json["from"]), Pos3D.json(json["to"]));
    faces = {
      for(String face in json["faces"])
        face: Texture.resource(json["faces"][face]
    };
  }
}

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
    file = dataFile("textures", json["texture"]);
    uv = json["uv"];
    tint = json["tintIndex"];
    
    save(resourceFile("textures", json["texture"], rotation: json["rotation"] ?? 0);
  }

  void save(File resource, {int rotation = 0}) {

  }
}