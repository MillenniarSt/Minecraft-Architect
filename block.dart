class BlockState implements JsonMappable<Map<String, dynamic>> {

  late Map<Conditions, BlockModel> models;
}

class Conditions implements JsonMappable<String> {

  late Map<String, String> conditions;

  
}