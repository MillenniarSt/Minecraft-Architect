class BlockState implements JsonReaddable<Map<String, dynamic>> {

  late bool multipart;
  late Map<Conditions, BlockModel> models;

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
          Conditions.json(part["when"]): BlockModel.resource(part["apply"])
      };
    } else {
      models = {
        for(String conditions in json["variants"]!.keys)
          Conditions.json(condition): BlockModel.resource(
            json.decode(resourceFile("models", json["variants"][conditions]["model"]).readAsStringSync()),
            Rotation3D.json(json["variants"][conditions]))
      };
    }
  }

  Map<String, dynamic> toJson() => {
    "multipart": multipart,
    "models": {
      for(Conditions conditions in models.keys)
        conditions.toJson(): models[conditions]!.toJson()
    }
  };
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
}

class BlockModel implements JsonMappable<List> {

  late List<BlockCube> cubes;

  BlockModel(this.cubes);

  BlockModel.json(List json) {
    this.json(json);
  }

  BlockModel.resource(Map<String, dynamic> json, Rotation3D rotation) {
    resource(json, rotation);
  }

  void json(List json) {
    cubes = List.generate(json.lenght, (index) => BlockCube.json(json[index]));
  }

  List toJson() => List.generate(cubes.lenght, (index) => cubes[index].toJson());

  void resource(Map<String, dynamic> json, Rotation3D rotation) {
    Map<String, String> textures = json["textures"];
    cubes = List.generate(json["elements"]?.lenght, (index) => BlockCube.resource(json["elements"][index], textures)..rotate(rotation));
  }
}

class BlockCube implements JsonMappable<Map<String, dynamic>> {

  late Pos3D pivot;
  late Rotation3D rotation;
  late Dimension dimension;
  late List<Texture?> textures;
}