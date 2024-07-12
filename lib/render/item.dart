import 'dart:io';

import '../util.dart';
import '../world.dart';
import 'render.dart';

class Item extends Render {

  late ItemModel model;

  Item(super.location, super.name, this.model);

  Item.json(super.location, super.json) : super.json();

  Item.resource(super.location, super.name, Map<String, dynamic> json) {
    resource(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    model = ItemModel.json(json);
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll(model.toJson());

  void resource(Map<String, dynamic> json) {
    model = ItemModel.resource(json);
  }

  Future<void> save() async {
    File file = loader.dataFile("item", location, "json");
    await file.create(recursive: true);
    await file.writeAsString(encoder.convert(toJson()).replaceAllMapped(
        RegExp(r'\[\s*([\d.,\s]+)\s*\]'), (match) => '[${match.group(1)!.replaceAll(RegExp(r'\s+'), ' ').trim()}]'
    ));
  }
}

class ItemModel implements JsonMappable<Map<String, dynamic>> {

  Display display = Display();
  List<Cube> cubes = [];

  ItemModel(this.cubes);

  ItemModel.json(Map<String, dynamic> json) {
    this.json(json);
  }

  ItemModel.resource(Map<String, dynamic> json, {Map<String, String> pTextures = const {}}) {
    resource(json, pTextures);
  }

  void json(Map<String, dynamic> json) {
    display = Display.json(json["display"]);
    cubes = List.generate(json["cubes"].length, (index) => Cube.json(json["cubes"][index]));
  }

  Map<String, dynamic> toJson() => {
    "display": display.toJson(),
    "cubes": List.generate(cubes.length, (index) => cubes[index].toJson())
  };

  void resource(Map<String, dynamic> json, Map<String, String> pTextures) {
    Map<String, String> textures = {
      if(json["textures"] != null)
        for(String key in json["textures"].keys)
          key: json["textures"][key][0] == "#" ? pTextures[json["textures"][key].substring(1)] ?? json["textures"][json["textures"][key].substring(1)]! : json["textures"][key],
      for(String key in pTextures.keys)
        key: pTextures[key]!
    };
    if(json["elements"] != null) {
      cubes = List.generate(json["elements"].length, (index) => Cube.resource(json["elements"][index], textures));
    }
    if(json["parent"] != null) {
      Location parentLoc = Location.json(json["parent"]);
      if(parentLoc == Location.minecraft("builtin/entity")) {
        print("Item model skipped, it is from \"builtin/entity\"");
      } else if(parentLoc == Location.minecraft("item/generated")) {
        cubes.addAll([
          for(String layer in textures.keys)
            if(layer.indexOf("layer") == 0)
              Cube(
                  dimension: Dimension(Pos.zero, Size(16, 16, 0)),
                  faces: {"north": Texture(loader.dataFile("textures", Location.json(textures[layer]!), "png"))..save(loader.resource("textures", Location.json(textures[layer]!), "png")!)}
              )
        ]);
        display + itemGenerated;
      } else if(parentLoc == Location.minecraft("item/handheld")) {
        cubes.addAll([
          for(String layer in textures.keys)
            if(layer.indexOf("layer") == 0)
              Cube(
                  dimension: Dimension(Pos.zero, Size(16, 16, 0)),
                  faces: {"north": Texture(loader.dataFile("textures", Location.json(textures[layer]!), "png"))..save(loader.resource("textures", Location.json(textures[layer]!), "png")!)}
              )
        ]);
        display + itemHandheld;
      } else {
        ItemModel parent = ItemModel.resource(loader.resourceJson("models", Location.json(json["parent"])), pTextures: textures);
        cubes.addAll(parent.cubes);
        display + parent.display;
      }
    }
  }
}

final Display itemGenerated = Display(
    gui: DisplayConfig(rotation: Rotation.zero, translation: Pos.zero, scale: Size(1, 1, 1)),
    fixed: DisplayConfig(rotation: Rotation(0, 180, 0), translation: Pos.zero, scale: Size(1, 1, 1))
);

final Display itemHandheld = Display(
    gui: DisplayConfig(rotation: Rotation.zero, translation: Pos.zero, scale: Size(1, 1, 1)),
    fixed: DisplayConfig(rotation: Rotation(0, 180, 0), translation: Pos.zero, scale: Size(1, 1, 1))
);

class Display implements JsonMappable<Map<String, dynamic>> {

  late DisplayConfig? gui;
  late DisplayConfig? fixed;

  Display({this.gui, this.fixed});

  Display.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    if(json["gui"] != null) {
      gui = DisplayConfig.json(json["gui"]);
    }
    if(json["fixed"] != null) {
      fixed = DisplayConfig.json(json["fixed"]);
    }
  }

  @override
  Map<String, dynamic> toJson() => {
    if(gui != null) "gui": gui!.toJson(),
    if(fixed != null) "fixed": fixed!.toJson()
  };

  void operator +(Display other) {
    if(gui == null) {
      gui = other.gui;
    }
    if(fixed == null) {
      fixed = other.fixed;
    }
  }
}

class DisplayConfig implements JsonMappable<Map<String, dynamic>> {

  late Rotation rotation;
  late Pos translation;
  late Size scale;

  DisplayConfig({required this.rotation, required this.translation, required this.scale});

  DisplayConfig.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    rotation = json["rotation"];
    translation = json["translation"];
    scale = json["scale"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "rotation": rotation,
    "translation": translation,
    "scale": scale
  };
}