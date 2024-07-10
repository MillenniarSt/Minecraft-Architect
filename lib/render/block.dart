import 'dart:convert';
import 'dart:math';

import '../util.dart';
import '../world.dart';
import 'render.dart';

class Block implements JsonMappable<Map<String, dynamic>> {

  late bool multipart;
  late Map<Conditions, List<BlockModel>> models;

  final _random = Random();

  Block(this.multipart, this.models);

  Block.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Block.resource(Map<String, dynamic> json) {
    resource(json);
  }

  void json(Map<String, dynamic> json) {
    multipart = json["multipart"];
    models = {
      for(String condition in json["models"]!.keys)
        Conditions.json(condition): List.generate(json["models"][condition].length, (index) => BlockModel.json(json["models"][condition][index]))
    };
  }

  void resource(Map<String, dynamic> json) {
    multipart = json["multipart"] != null;
    if (multipart) {
      models = {
        for(Map<String, dynamic> part in json["multipart"])
          Conditions.json(part["when"]): part["apply"] is List ?
          List.generate(part["apply"].length, (index) =>
              BlockModel.resource(jsonDecode(loader.resourceText("models", part["apply"][index]["model"])), rotation: Rotation.json(part["apply"][index]))
          ) :
          [BlockModel.resource(jsonDecode(loader.resourceText("models", part["apply"]["model"])), rotation: Rotation.json(part["apply"]))]
      };
    } else {
      models = {
        for(String condition in json["variants"]!.keys)
          Conditions.json(condition): json["variants"][condition] is List ?
          List.generate(json["variants"][condition].length, (index) =>
              BlockModel.resource(jsonDecode(loader.resourceText("models", json["variants"][condition][index]["model"])), rotation: Rotation.json(json["variants"][condition][index]))
          ) :
          [BlockModel.resource(jsonDecode(loader.resourceText("models", json["variants"][condition]["model"])), rotation: Rotation.json(json["variants"][condition]))]
      };
    }
  }

  Map<String, dynamic> toJson() => {
    "multipart": multipart,
    "models": {
      for(Conditions conditions in models.keys)
        conditions.toJson(): List.generate(models[conditions]!.length, (index) => models[conditions]![index].toJson())
    }
  };

  List<BlockModel> model(Map<String, dynamic> conditions) {
    if(multipart) {
      List<BlockModel> rModels = [];
      for(Conditions condition in models.keys) {
        if(condition == conditions) {
          rModels.add(models[condition]![_random.nextInt(models[condition]!.length)]);
        }
      }
      return rModels;
    } else {
      for(Conditions condition in models.keys) {
        if(condition == conditions) {
          return [models[condition]![_random.nextInt(models[condition]!.length)]];
        }
      }
      return [];
    }
  }
}

class Conditions implements JsonMappable<String> {

  late final Map<String, String> conditions;

  Conditions(this.conditions);

  Conditions.json(String json) {
    this.json(json);
  }

  void json(String json) {
    conditions = {
      for(String condition in json.split(","))
        condition.substring(0, condition.indexOf("=")): condition.substring(condition.indexOf("=") +1)
    };
  }

  String toJson() => [
    for(String condition in conditions.keys)
      "$condition=${conditions[condition]}"
  ].join(",");

  @override
  bool operator ==(Object other) {
    Map<String, dynamic> otherConditions = other is Conditions ? other.conditions : other as Map<String, dynamic>;
    for(String condition in conditions.keys) {
      if(otherConditions.containsKey(condition) && otherConditions[condition].toString() != conditions[condition]) {
        return false;
      }
    }
    return true;
  }
}

class BlockModel implements JsonMappable<Map<String, dynamic>> {

  Rotation? rotation;
  late List<Cube> cubes;

  BlockModel(this.cubes);

  BlockModel.json(Map<String, dynamic> json) {
    this.json(json);
  }

  BlockModel.resource(Map<String, dynamic> json, {this.rotation, Map<String, String> pTextures = const {}}) {
    resource(json, pTextures);
  }

  void json(Map<String, dynamic> json) {
    if(json["rotation"] != null) {
      rotation = Rotation.json(json["rotation"]);
    }
    cubes = List.generate(json["cubes"].length, (index) => Cube.json(json["cubes"][index]));
  }

  Map<String, dynamic> toJson() => {
    if(rotation != null) "rotation": rotation!.toJson(),
    "cubes": List.generate(cubes.length, (index) => cubes[index].toJson())
};

  void resource(Map<String, dynamic> json, Map<String, String> pTextures) {
    Map<String, String> textures = {
      for(String key in json["textures"].keys)
        key: json["textures"][key][0] == "#" ? pTextures[key.substring(1)]! : json["textures"][key]
    };
    cubes = List.generate(json["elements"]?.length, (index) => Cube.resource(json["elements"][index], textures));

    if(json["parent"] != null) {
      cubes.addAll(BlockModel.resource(jsonDecode(loader.resourceText("models", json["parent"])), pTextures: textures).cubes);
    }
  }
}