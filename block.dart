class BlockState implements JsonReaddable<Map<String, dynamic>> {

  late bool multipart;
  late Map<Conditions, BlockModel> models;

  BlockState(this.multipart, this.conditions);

  BlockState.json(Map<String, dynamic> json) {
    this.json(json);
  }

  void json(Map<String, dynamic> json) {
    models = {
      for(String conditions in json["variants"]?.keys)
        Conditions.json(condition): BlockModel.json(json["variants"]![conditions]!)
    };
  }

  void resource(Map<String, dynamic> json) {
    multipart = json.contains("multipart");
    if(multipart) {
      models = {
        for(Map<String, dynamic> part in json["multipart"])
          Conditions.json(part["when"]): BlockModel.json(part["apply"])
      };
    } else {
      models = {
        for(String conditions in json["variants"]!.keys)
          Conditions.json(condition): BlockModel.json(json["variants"]![conditions]!)
      };
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
}