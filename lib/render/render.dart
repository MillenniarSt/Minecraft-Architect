import 'dart:io';

import 'package:archive/archive.dart';

import '../minecraft.dart';
import '../util.dart';
import '../world.dart';

String minecraftDir = Platform.isWindows ? Platform.environment["APPDATA"]! + "\\.minecraft" : Platform.environment["HOME"]! + "\\Library\\Application Support\\minecraft";

MinecraftLoader loader = MinecraftLoader("1.20.1");

class MinecraftLoader {

  String version;
  Archive? archive;

  MinecraftLoader(this.version);

  void open() => archive = ZipDecoder().decodeBytes(resourceJar.readAsBytesSync());

  void close() => archive = null;

  String resourcePath(String dir, String location) =>
      "$dir/${location.contains(":") ? location.substring(0, location.indexOf(":")) : "minecraft"}/${location.contains(":") ? location.substring(location.indexOf(":") +1) : location}";

  File dataFile(String dir, String location) => File("$dataDir\\${resourcePath(dir, location)}");

  List<int>? resource(String dir, String location) {
    return archive!.findFile(resourcePath(dir, location).replaceAll("/", "\\"))?.content;
  }

  String resourceText(String dir, String location) => String.fromCharCodes(resource(dir, location)!);

  File get resourceJar => File("$minecraftDir\\versions\\$version\\$version.jar");

  String get dataDir => "$engineerDir\\$version";
}

class Cube implements JsonMappable<Map<String, dynamic>> {

  Pos? pivot;
  Rotation? rotation;
  late Dimension dimension;
  late Map<String, Texture> faces;

  Cube({this.pivot, this.rotation, required this.dimension, this.faces = const {}});

  Cube.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Cube.resource(Map<String, dynamic> json,   Map<String, String> textures) {
    resource(json, textures);
  }

  void json(Map<String, dynamic> json) {
    if(json["rotation"] != null) {
      pivot = Pos.json(json["pivot"]);
      rotation = Rotation.json(json["rotation"]);
    }
    dimension = Dimension.json(json["dimension"]);
    faces = {
      for(String face in json["faces"])
        face: Texture.json(json["faces"][face])
    };
  }

  Map<String, dynamic> toJson() => {
    if(pivot != null) "pivot": pivot!.toJson(),
    if(rotation != null) "rotation": rotation!.toJson(),
    "dimension": dimension.toJson(),
    "faces": {
      for(String face in faces.keys)
        face: faces[face]!.toJson()
    }
  };

  void resource(Map<String, dynamic> json, Map<String, String> textures) {
    if(json["rotation"] != null) {
      pivot = Pos.json(json["rotation"]["origin"]);
      rotation = Rotation.axis(json["rotation"]["axis"], json["rotation"]["angle"]);
    }
    dimension = Dimension.poss(Pos.json(json["from"]), Pos.json(json["to"]));
    faces = {
      for(String face in json["faces"])
        face: Texture.resource(json["faces"][face])
    };
  }
}

class Texture implements JsonMappable<Map<String, dynamic>> {

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
    file = loader.dataFile("textures", json["texture"]);
    uv = json["uv"];
    tint = json["tintIndex"];
    
    save(loader.resource("textures", json["texture"])!, rotation: json["rotation"] ?? 0);
  }

  void save(List<int> resource, {int rotation = 0}) {

  }
}