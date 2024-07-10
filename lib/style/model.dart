import '../architect.dart';
import '../elements.dart';
import '../minecraft.dart';
import '../util.dart';
import '../world.dart';
import 'style.dart';

class MinecraftBuildStructure {

  final MinecraftStructure structure;

  Dimension dimension;
  final List<MinecraftBuildModelPart> buildParts = [];

  MinecraftBuildStructure(this.structure, this.dimension) {
    random();
  }

  void random() {
    buildParts.clear();
    Map<String, MinecraftModel> models = {};
    for(String key in structure.models.keys) {
      models[key] = structure.models[key]!.random.models.list.last;
    }
    for(MinecraftModelPart part in structure.parts) {
      Dimension dimension = part.anchor.build(this.dimension.size);
      buildParts.add(MinecraftBuildModelPart(dimension.pos, part.anchor.isRegular ? null : dimension.size, models[part.model]!, part.rotation));
    }
  }

  void build(MinecraftArchitect converter) {
    for(MinecraftBuildModelPart part in buildParts) {
      part.build(converter, dimension.pos);
    }
  }
}

class MinecraftBuildModelPart {

  final Pos pos;
  final Size? size;
  final MinecraftModel model;
  final RegularRotation3D rotation;

  MinecraftBuildModelPart(this.pos, this.size, this.model, this.rotation);

  void build(MinecraftArchitect architect, Pos relPos) {
    if(size == null) {
      MinecraftModel model = this.model;
      architect.placeAllBlock(model.buildBlocks(architect.style, relPos + pos));
      for(MinecraftEntity entity in model.buildEntities(pos)) {
        architect.engineer.entityConfig.applyDefault(entity);
        architect.addEntity(entity..pos += relPos);
      }
    } else {
      Dimension dimension = Dimension(pos, size!);
      MinecraftModel model = this.model.rotate(rotation);
      Size modelSize = model.dimension.size;
      int x = 0;
      int z = 0;
      int y = 0;
      do {
        do {
          do {
            Pos modelPos = Pos(pos.x + x, pos.z + z, pos.y + y);
            Map<Pos, MinecraftBlock> modelBlocks = model.buildBlocks(architect.style, modelPos);
            for(Pos blockPos in modelBlocks.keys) {
              if(dimension.contains(blockPos)) {
                architect.placeBlock(relPos + blockPos, modelBlocks[blockPos]!);
              }
            }
            for(MinecraftEntity entity in model.buildEntities(modelPos)) {
              if(dimension.contains(entity.pos)) {
                architect.engineer.entityConfig.applyDefault(entity);
                architect.addEntity(entity..pos += relPos);
              }
            }
            y += modelSize.y.floor();
          } while(y < size!.y);
          z += modelSize.z.floor();
        } while(z < size!.z);
        x += modelSize.x.floor();
      } while(x < size!.x);
    }
  }
}

class MinecraftStructure implements JsonReadable<Map<String, dynamic>> {

  final Map<String, RandomList<MinecraftModelPackage>> models = {};
  final List<MinecraftModelPart> parts = [];

  MinecraftStructure();

  MinecraftStructure.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    for(String key in json["models"].keys) {
      models[key] = RandomList(json[key] is List ?
      List.generate(json["models"][key].lenght, (index) => minecraftEngineer.models[(json["models"][key][index] as String).replaceAll("/", "\\")]!)
          : [minecraftEngineer.models[(json["models"][key] as String).replaceAll("/", "\\")]!]);
    }
    for(int i = 0; i < json["parts"]!.length; i++) {
      parts.add(MinecraftModelPart.json(json["parts"][i]));
    }
  }
}

class MinecraftModelPart implements JsonReadable<Map<String, dynamic>> {

  late final Anchor<int> anchor;
  late final String model;
  late final RegularRotation3D rotation;

  MinecraftModelPart(this.anchor, this.model, this.rotation);

  MinecraftModelPart.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    anchor = Anchor.json(json["pos"] ?? {});
    model = json["model"];
    rotation = RegularRotation3D.rotationOf(Rotation.json(json["rotation"] ?? {}))!;
  }
}

class MinecraftModelPackage implements JsonReadable<List> {

  final String location;
  final RandomList<MinecraftModel> models = RandomList.empty();

  MinecraftModelPackage(this.location);

  MinecraftModelPackage.json(this.location, List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    for(int i = 0; i < json.length; i++) {
      models.list.add(MinecraftModel.json(json[i]));
    }
  }
}

class MinecraftModel implements JsonMappable<List> {

  final List<MinecraftBlockData> blocks = [];
  final List<MinecraftEntityData> entities = [];

  MinecraftModel();

  MinecraftModel.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    for(int i = 0; i < json.length; i++) {
      if(json[i]["type"] == "entity") {
        entities.add(MinecraftEntityData.json(json[i]));
      } else {
        blocks.add(MinecraftBlockData.json(json[i]));
      }
    }
  }

  Dimension get dimension => Dimension.findDimension(List.generate(blocks.length, (index) => blocks[index].pos));

  Map<Pos, MinecraftBlock> buildBlocks(MinecraftStyle style, Pos pos) => {
    for(MinecraftBlockData block in blocks)
      pos + block.pos: block.getFromStyle(style)
  };

  List<MinecraftEntity> buildEntities(Pos pos) => List.generate(entities.length, (index) => entities[index].entity..pos += pos);

  MinecraftModel rotate(RegularRotation3D rotation) {
    MinecraftModel model = MinecraftModel();
    for(MinecraftBlockData block in blocks) {
      model.blocks.add(MinecraftBlockData(block.pos.rotate(Pos.zero, rotation.rotation), block.id, block.style, block.properties.rotate(rotation)));
    }
    return model;
  }

  @override
  List toJson() => List.generate(blocks.length, (index) => blocks[index].toJson());
}

class MinecraftBlockData implements JsonMappable<Map<String, dynamic>> {

  late final Pos pos;
  late final String? id;
  late final MinecraftBlockDataStyle? style;
  late final MinecraftBlockProperties properties;

  MinecraftBlockData(this.pos, this.id, this.style, this.properties);

  MinecraftBlockData.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pos = json["pos"] != null ? Pos.json(json["pos"]) : Pos.zero;
    id = json["id"];
    style = json["style"] != null ? MinecraftBlockDataStyle.json(json["style"]) : null;
    properties = MinecraftBlockProperties.json(json["properties"] ?? {});
  }

  @override
  Map<String, dynamic> toJson() => {
    if(pos != Pos.zero) "pos": pos.toJson(),
    if(id != null) "id": id,
    if(style != null) "style": style!.toJson(),
    if(properties.entries.isNotEmpty) "properties": properties.toJson()
  };

  MinecraftBlock getFromStyle(MinecraftStyle mStyle) {
    if(id != null) {
      if(id![0] == "#") {
        return mStyle.blocks[id!.substring(1)]!.block..properties += properties.defined;
      } else {
        return MinecraftBlock(id!, properties.defined);
      }
    } else if(style != null) {
      return mStyle.materials[style!.material]!.build(style!.index, style!.shape)..properties += properties.defined;
    }
    return MinecraftBlock("air", DefinedMinecraftProperties.empty());
  }
}

class MinecraftBlockDataStyle implements JsonMappable<Map<String, dynamic>> {

  late final String material;
  late final int index;
  late final String? shape;

  MinecraftBlockDataStyle(this.material);

  MinecraftBlockDataStyle.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    material = json["material"];
    index = json["index"] ?? 1;
    shape = json["shape"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "material": material,
    if(index != 1) "index": index,
    if(shape != null) "shape": shape
  };
}

class MinecraftBlockProperties implements JsonMappable<Map<String, dynamic>> {

  final Map<String, RandomList> entries = {};

  MinecraftBlockProperties();

  MinecraftBlockProperties.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    for(String key in json.keys) {
      entries[key] = json[key] is List ? RandomList(json[key] as List) : RandomList([json[key]]);
    }
  }

  @override
  Map<String, dynamic> toJson() => {
    for(String key in entries.keys)
      key: entries[key]!.list.length == 1 ? entries[key]!.list.first : entries[key]!.list
  };

  bool get isEmpty => entries.isEmpty;

  MinecraftBlockProperties rotate(RegularRotation3D rotation) {
    //TODO
    return MinecraftBlockProperties();
  }

  DefinedMinecraftProperties get defined => DefinedMinecraftProperties({
    for(String key in entries.keys)
      key: entries[key]!.random
  });

  MinecraftBlockProperties operator +(MinecraftBlockProperties other) => MinecraftBlockProperties()..entries.addAll(entries)..entries.addAll(other.entries);
}

class MinecraftEntityData implements JsonMappable<Map<String, dynamic>> {

  late final Pos pos;
  late final String id;
  late final MinecraftEntityProperties properties;

  MinecraftEntityData(this.pos, this.id, this.properties);

  MinecraftEntityData.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pos = json["pos"] != null ? Pos.json(json["pos"]) : Pos.zero;
    id = json["id"];
    properties = MinecraftEntityProperties.json(json["properties"] ?? {});
  }

  @override
  Map<String, dynamic> toJson() => {
    if(pos != Pos.zero) "pos": pos.toJson(),
    "id": id,
    if(properties.entries.isNotEmpty) "properties": properties.toJson()
  };

  MinecraftEntity get entity => MinecraftEntity.nbt(pos, id, properties.defined);
}

class MinecraftEntityProperties implements JsonMappable<Map<String, dynamic>> {

  late final Map<String, dynamic> entries;

  MinecraftEntityProperties(this.entries);

  MinecraftEntityProperties.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) => entries = json;

  @override
  Map<String, dynamic> toJson() => entries;

  bool get isEmpty => entries.isEmpty;

  DefinedMinecraftProperties get defined => DefinedMinecraftProperties(Map.from(entries));

  MinecraftEntityProperties operator +(MinecraftEntityProperties other) => MinecraftEntityProperties(entries..addAll(other.entries));
}