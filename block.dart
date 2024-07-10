class BlockState implements JsonReaddable<Map<String, dynamic>> {

  late bool multipart;
  late Map<Conditions, List<BlockModel>> models;

  BlockState(this.multipart, this.conditions);

  BlockState.json(Map<String, dynamic> json) {
    this.json(json);
  }

  BlockState.resource(Map<String, dynamic> json) {
    resource(json);
  }

  void json(Map<String, dynamic> json) {
    multipart = json["multipart"];
    models = {
      for(String conditions in json["models"]!.keys)
        Conditions.json(condition): BlockModel.json(json["models"]![conditions]!)
    };
  }

  void resource(Map<String, dynamic> json) {
    multipart = json.contains("multipart");
    if(multipart) {
      models = {
        for(Map<String, dynamic> part in json["multipart"])
          Conditions.json(part["when"]): part["apply"] is List ?
            List.generate(part["apply"].lenght, (index) => BlockModel.resource(
              json.decode(resourceFile("models", part["apply"][index]["model"]).readAsStringSync()),
              rotation: Rotation3D.json(part["apply"][index]))) :
            [BlockModel.resource(
              json.decode(resourceFile("models", part["apply"]["model"]).readAsStringSync()),
              rotation: Rotation3D.json(part["apply"]))]
      };
    } else {
      models = {
        for(String conditions in json["variants"]!.keys)
          Conditions.json(condition): json["variants"][condition] is List ?
            List.generate(json["variants"][condition].lenght, (index) => BlockModel.resource(
              json.decode(resourceFile("models", json["variants"][conditions][index]["model"]).readAsStringSync()),
              rotation: Rotation3D.json(json["variants"][conditions][index]))) :
            [BlockModel.resource(
              json.decode(resourceFile("models", json["variants"][conditions]["model"]).readAsStringSync()),
              rotation: Rotation3D.json(json["variants"][conditions]))]
      };
    }

  Map<String, dynamic> toJson() => {
    "multipart": multipart,
    "models": {
      for(Conditions conditions in models.keys)
        conditions.toJson(): models[conditions]!.toJson()
    }
  };

  List<BlockModel> model(Map<String, dynamic> conditions) {
    if(multipart) {
      List<BlockModel> rModels = [];
      for(Conditions condition in models.keys) {
        if(condition == conditions) {
          rModels.add(models[condition][]);
        }
      }
      return rModels;
    } else {
      for(Conditions condition in models.keys) {
        if(condition == conditions) {
          return [models[condition][]];
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
      for(String conditions in conditions.split(","))
        condition.substring(0, condition.indexOf("=")): condition.substring(condition.indexOf("=") +1)
    }
  }

  String toJson() => [
    for(String condition in conditions)
      "$condition=${conditions[condition]!}"
  ].join(",");

  operator ==(Map<String, dynamic> other) {
  for(String condition in conditions) {
    if(other.contains(condition) && other[condition].toString() != conditions[condition]) {
      return false;
    }
  }
  return true;
  }
}

class BlockModel implements JsonMappable<Map<String, dynamic>> {

  late Rotation3D? rotation;
  late List<Cube> cubes;

  BlockModel(this.cubes);

  BlockModel.json(Map<String, dynamic> json) {
    this.json(json);
  }

  BlockModel.resource(Map<String, dynamic> json, {this.rotation, Map<String, String> pTextures = {}}) {
    resource(json, pTextures);
  }

  void json(Map<String, dynamic> json) {
    rotation = Rotation3D.json(json["rotation"]?);
    cubes = List.generate(json["cubes"].lenght, (index) => Cube.json(json["cubes"][index]));
  }

  Map<String, dynamic> toJson() => {
    if(rotation != null) "rotation": rotation.toJson(),
    "cubes": List.generate(cubes.lenght, (index) => cubes[index].toJson())
};

  void resource(Map<String, dynamic> json, Map<String, String> pTextures) {
    Map<String, String> textures = {
      for(String key in json["textures"].keys)
        key: textures[key][0] == "#" ? pTextures[key.substring(1)]! : textures[key]
    };
    cubes = List.generate(json["elements"]?.lenght, (index) => Cube.resource(json["elements"][index], textures));

    if(json.contains("parent")) {
      cubes.addAll(BlockModel.resource(json.decode(resourceFile("models", json["parent"]).readAsStringSync()), pTextures: textures).cubes);
    }
  }
}