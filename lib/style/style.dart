import '../../util.dart';
import '../component/component.dart';
import '../elements.dart';
import '../minecraft.dart';
import 'model.dart';

class MinecraftStyle extends ComponentStyle {

  final Map<String, MinecraftMaterial> materials = {};
  
  final Map<String, MinecraftTag> blocks = {};
  final Map<String, MinecraftTag> entities = {};
  final Map<String, MinecraftTag> items = {};

  MinecraftStyle(super.identifier, super.name);

  MinecraftStyle.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    for(String key in (json["tags"]["block"] ?? {}).keys) {
      blocks[key] = MinecraftTag.json(json["tags"]["block"][key]);
    }
    for(String key in (json["tags"]["entity"] ?? {}).keys) {
      entities[key] = MinecraftTag.json(json["tags"]["entity"][key]);
    }
    for(String key in (json["tags"]["item"] ?? {}).keys) {
      items[key] = MinecraftTag.json(json["tags"]["item"][key]);
    }

    for(String key in (json["materials"] ?? {}).keys) {
      materials[key] = MinecraftMaterial.json(json["materials"][key]);
    }
  }
}

class MinecraftTag implements JsonMappable<Map<String, dynamic>> {
  
  final RandomMap<String, MinecraftBlockProperties> elements = RandomMap.empty();

  MinecraftTag();

  MinecraftTag.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    for(String key in json.keys) {
      elements.map[key] = MinecraftBlockProperties.json(json[key]);
    }
  }

  @override
  Map<String, dynamic> toJson() => {
    for(String key in elements.map.keys)
      key: elements.map[key]!.toJson()
  };

  bool get isSingle => elements.map.length == 1 && elements.map.values.first.isEmpty;

  MinecraftBlock get block {
    MapEntry<String, MinecraftBlockProperties> entry = elements.random;
    return MinecraftBlock(entry.key, entry.value.defined);
  }
}

class MinecraftMaterial implements JsonMappable<List> {
  
  late final List<MinecraftTag> tags;

  MinecraftMaterial();

  MinecraftMaterial.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) => tags = List.generate(json.length, (index) {
    if(json[index] is String) {
      return MinecraftTag()..elements.map[json[index]] = MinecraftBlockProperties();
    } else if(json[index] is List) {
      MinecraftTag tag = MinecraftTag();
      for(String block in json[index]) {
        tag.elements.map[block] = MinecraftBlockProperties();
      }
      return tag;
    }
    return MinecraftTag.json(json[index]);
  });

  @override
  List toJson() => List.generate(tags.length, (index) {
    if(tags[index].elements.map.length == 1 && tags[index].elements.map.entries.first.value.isEmpty) {
      return tags[index].elements.map.entries.first.key;
    } else if(_isList(index)) {
      List list = [];
      for(String key in tags[index].elements.map.keys) {
        list.add(key);
      }
      return list;
    } else {
      return tags[index].toJson();
    }
  });

  bool _isList(int index) {
    for(MinecraftBlockProperties property in tags[index].elements.map.values) {
      if(!property.isEmpty) {
        return false;
      }
    }
    return true;
  }

  MinecraftBlock build(int index, String? shape) {
    MapEntry<String, MinecraftBlockProperties> random = tags[index].elements.random;
    return minecraftEngineer.materialConfig.build(random.key, shape)..properties += random.value.defined;
  }
}