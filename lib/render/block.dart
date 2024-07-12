import 'dart:convert';
import 'dart:io';

import '../util.dart';
import '../world.dart';
import 'item.dart';
import 'render.dart';

class Block extends Render {

  Item? item;

  late bool multipart;
  late List<BlockState> blockstates;

  Block(super.location, super.name, this.item, this.multipart, this.blockstates);

  Block.json(super.location, super.json) : super.json();

  Block.resource(super.location, super.name, Map<String, dynamic> json) {
    resource(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    multipart = json["multipart"];
    blockstates = List.generate(json["blockstates"].length, (index) => BlockState.json(json["blockstates"][index]));
    if(json["item"] != null) {
      item = Item.json(Location.json(json["item"]), loader.resourceJson("models/item", Location.json(json["item"])));
    }
  }
  
  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    if(item != null) "item": item!.location,
    "multipart": multipart,
    "blockstates": List.generate(blockstates.length, (index) => blockstates[index].toJson())
  });
  
  void resource(Map<String, dynamic> json) {
    multipart = json["multipart"] != null;
    if(multipart) {
      blockstates = List.generate(json["multipart"].length, (index) => BlockState.resource(json["multipart"][index]["apply"], json["multipart"][index]["when"]));
    } else {
      blockstates = [
        for(String condition in json["variants"].keys)
          BlockState.resource(json["variants"][condition], condition)
      ];
    }
    List<int>? bytes = loader.resource("models/item", location, "json");
    if(bytes != null) {
      item = Item.resource(location, name, jsonDecode(String.fromCharCodes(bytes)));
    }
  }

  List<BlockModel> model(Map<String, dynamic> conditions) {
    if(multipart) {
      List<BlockModel> rModels = [];
      for(BlockState blockstate in blockstates) {
        if(blockstate.condition == conditions) {
          rModels.add(blockstate.models.random);
        }
      }
      return rModels;
    } else {
      for(BlockState blockstate in blockstates) {
        if(blockstate.condition == conditions) {
          return [blockstate.models.random];
        }
      }
      return [];
    }
  }

  Future<void> save() async {
    File file = loader.dataFile("block", location, "json");
    await file.create(recursive: true);
    await file.writeAsString(encoder.convert(toJson()).replaceAllMapped(
        RegExp(r'\[\s*([\d.,\s]+)\s*\]'), (match) => '[${match.group(1)!.replaceAll(RegExp(r'\s+'), ' ').trim()}]'
    ));
    if(item != null) {
      await item!.save();
    }
  }
}

class BlockState implements JsonMappable<Map<String, dynamic>> {

  late Condition condition;
  late RandomList<BlockModel> models;

  BlockState(this.models);

  BlockState.json(Map<String, dynamic> json) {
    this.json(json);
  }

  BlockState.resource(models, condition) {
    resource(models, condition);
  }

  void json(Map<String, dynamic> json) {
    condition = Condition.json(json["condition"]);
    models = RandomList(List.generate(json["models"].length, (index) => BlockModel.json(json["models"][index])));
  }

  Map<String, dynamic> toJson() => {
    "condition": condition.toJson(),
    "models": List.generate(models.list.length, (index) => models.list[index].toJson())
  };

  void resource(models, condition) {
    this.condition = Condition.resource(condition);
    this.models = models is List ?
      RandomList(List.generate(models.length, (index) => BlockModel.resource(loader.resourceJson("models", Location.json(models[index]["model"])), rotation: Rotation.json(models[index])))) :
      RandomList([BlockModel.resource(loader.resourceJson("models", Location.json(models["model"])), rotation: Rotation.json(models))]);
  }
}

class Condition implements JsonMappable<Map<String, dynamic>> {

  late Map<String, dynamic> conditions;

  Condition(this.conditions);

  Condition.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Condition.resource(json) {
    resource(json);
  }

  void json(Map<String, dynamic> json) {
    conditions = json;
  }

  Map<String, dynamic> toJson() => conditions;

  void resource(json) {
    if(json is String && json.isNotEmpty) {
      conditions = {
        for(String condition in json.split(","))
          condition.substring(0, condition.indexOf("=")): condition.substring(condition.indexOf("=") +1)
      };
    } else if(json is Map<String, dynamic>) {
      conditions = json;
    } else {
      conditions = {};
    }
  }

  //TODO
  @override
  bool operator ==(Object other) {
    Map<String, dynamic> otherConditions = other is Condition ? other.conditions : other as Map<String, dynamic>;
    for(String condition in conditions.keys) {
      if(otherConditions.containsKey(condition) && otherConditions[condition].toString() != conditions[condition]) {
        return false;
      }
    }
    return true;
  }
}

class BlockModel implements JsonMappable<Map<String, dynamic>> {

  Rotation rotation = Rotation.zero;
  List<Cube> cubes = [];

  BlockModel(this.cubes);

  BlockModel.json(Map<String, dynamic> json) {
    this.json(json);
  }

  BlockModel.resource(Map<String, dynamic> json, {Rotation? rotation, Map<String, String> pTextures = const {}}) {
    this.rotation = rotation ?? Rotation.zero;
    resource(json, pTextures);
  }

  void json(Map<String, dynamic> json) {
    if(json["rotation"] != null) {
      rotation = Rotation.json(json["rotation"]);
    }
    cubes = List.generate(json["cubes"].length, (index) => Cube.json(json["cubes"][index]));
  }

  Map<String, dynamic> toJson() => {
    if(rotation != Rotation.zero) "rotation": rotation.toJson(),
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
      cubes.addAll(BlockModel.resource(loader.resourceJson("models", Location.json(json["parent"])), pTextures: textures).cubes);
    }
  }
}