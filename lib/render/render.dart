import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:beaver_builder_api/render/item.dart';

import '../minecraft.dart';
import '../util.dart';
import '../world.dart';
import 'block.dart';

String minecraftDir = Platform.isWindows ? Platform.environment["APPDATA"]! + "\\.minecraft" : Platform.environment["HOME"]! + "\\Library\\Application Support\\minecraft";

MinecraftLoader loader = MinecraftLoader("1.20.1");

//Test Generate resource
main() => loader.generate();

class MinecraftLoader {

  String version;
  Archive? _archive;

  late Map<Location, Block> blocks;
  late Map<Location, Item> items;

  MinecraftLoader(this.version);

  void open() => _archive = ZipDecoder().decodeBytes(resourceJar.readAsBytesSync());

  void close() => _archive = null;

  bool get isOpen => _archive != null;

  Future<void> generate() async {
    if(!isOpen) {
      open();
    }

    blocks = {};
    items = {};

    for(ArchiveFile file in _archive!) {
      List<String> dirs = file.name.split("/");

      if(dirs.length == 4 && dirs[0] == "assets" && dirs[2] == "lang" && dirs[3] == "en_us.json") {
        Map<String, dynamic> lang = jsonDecode(String.fromCharCodes(file.content));
        for(String key in lang.keys) {
          List<String> args = key.split(".");
          if(args.length == 3 && args[0] == "block") {
            List<int>? bytes = resource("blockstates", Location(args[1], args[2]), "json");
            if(bytes != null) {
              Block block = Block.resource(Location(args[1], args[2]), lang[key], jsonDecode(String.fromCharCodes(bytes)));
              await block.save();
              blocks[block.location] = block;
              if(block.item != null) {
                items[block.item!.location] = block.item!;
              }
            }
          } else if(args.length == 3 && args[0] == "item") {
            List<int>? bytes = resource("models/item", Location(args[1], args[2]), "json");
            if(bytes != null) {
              Item item = Item.resource(Location(args[1], args[2]), lang[key], jsonDecode(String.fromCharCodes(bytes)));
              await item.save();
              items[item.location] = item;
            }
          }
        }
      }
    }
  }

  String resourcePath(String dir, Location location, String extension) => "${location.mod}/$dir/${location.id}.$extension".replaceAll("\\", "/");

  File dataFile(String dir, Location location, String extension) => File("$dataDir\\${resourcePath(dir, location, extension)}");

  List<int>? resource(String dir, Location location, String extension) {
    return _archive!.findFile("assets/${resourcePath(dir, location, extension)}")?.content;
  }

  dynamic resourceJson(String dir, Location location) => jsonDecode(String.fromCharCodes(resource(dir, location, "json")!));

  File get resourceJar => File("$minecraftDir\\versions\\$version\\$version.jar");

  String get dataDir => "$engineerDir\\$version";
}

abstract class Render implements JsonMappable<Map<String, dynamic>> {

  final Location location;
  
  late final String name;

  Render(this.location, this.name);

  Render.json(this.location, Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    name = json["name"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "name": name
  };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Render &&
          runtimeType == other.runtimeType &&
          location == other.location;

  @override
  int get hashCode => location.hashCode;
}

class Location implements JsonMappable<String> {

  late final String mod;
  late final String id;

  Location(this.mod, this.id);

  Location.minecraft(this.id) : mod = "minecraft";

  Location.json(String json) {
    this.json(json);
  }

  @override
  void json(String json) {
    mod = json.contains(":") ? json.substring(0, json.indexOf(":")) : "minecraft";
    id = json.contains(":") ? json.substring(json.indexOf(":") +1) : json;
  }

  @override
  String toJson() => "$mod:$id";

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Location &&
          runtimeType == other.runtimeType &&
          mod == other.mod &&
          id == other.id;

  @override
  int get hashCode => mod.hashCode ^ id.hashCode;
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
      rotation = Rotation.axis(json["rotation"]["axis"], json["rotation"]["angle"].toDouble());
    }
    dimension = Dimension.poss(Pos.json(json["from"]), Pos.json(json["to"]));
    faces = {
      for(String face in json["faces"].keys)
        face: Texture.resource(json["faces"][face], textures)
    };
  }
}

class Texture implements JsonMappable<Map<String, dynamic>> {

  late File file;
  late List<num> uv;
  late int? tint;

  Texture(this.file, {this.uv = const [0, 0, 16, 16], this.tint});
  
  Texture.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Texture.resource(Map<String, dynamic> json, Map<String, String> textures) {
    resource(json, textures);
  }

  void json(Map<String, dynamic> json) {
    file = File("${loader.dataDir}/${json["file"]}.png");
    uv = List.castFrom(json["uv"]);
    tint = json["tint"];
  }

  Map<String, dynamic> toJson() => {
    "file": file.path.substring(loader.dataDir.length +1, file.path.length - 4),
    "uv": uv,
    if(tint != null) "tint": tint
  };

  void resource(Map<String, dynamic> json, Map<String, String> textures) {
    file = loader.dataFile("textures", Location.json(textures[json["texture"].substring(1)] ?? textures["particle"]!), "png");
    uv = List.castFrom(json["uv"] ?? [0, 0, 16, 16]);
    tint = json["tintIndex"];

    if(!file.existsSync()) {
      save(loader.resource("textures", Location.json(textures[json["texture"].substring(1)] ?? textures["particle"]!), "png")!, rotation: json["rotation"] ?? 0);
    }
  }

  void save(List<int> resource, {int rotation = 0}) {
    file.createSync(recursive: true);
    file.writeAsBytesSync(resource);
  }
}