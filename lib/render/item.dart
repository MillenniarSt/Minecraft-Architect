class Item implements JsonMappable<Map<String, dynamic>> {

  late Display display;
  late List<Cube> cubes;

  Item(this.cubes);

  Item.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Item.resource(Map<String, dynamic> json, {Map<String, String> pTextures = const {}}) {
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
      for(String key in json["textures"].keys)
        key: json["textures"][key][0] == "#" ? pTextures[key.substring(1)]! : json["textures"][key]
    };
    cubes = List.generate(json["elements"]?.length, (index) => Cube.resource(json["elements"][index], textures));

    if(json["parent"] != null) {
      cubes.addAll(BlockModel.resource(jsonDecode(loader.resourceText("models", json["parent"])), pTextures: textures).cubes);
    }
  }
}