import '../../world/world3D.dart';
import 'elements.dart';

class MinecraftArchitect {

  int dataVersion = 3578;

  final Map<Pos3D, MinecraftBlock> blocks = {};
  final List<MinecraftEntity> entities = [];

  MinecraftArchitect(super.data, super.style);

  MinecraftArchitect.map(super.data, super.style, super.map) :super.map();

  @override
  Future<void> build(Project project) async {
    for(MainBuilder builder in project.builders) {
      for(Component component in builder.components) {
        component.build(this);
      }
    }
  }

  void saveNbt(File file) {
    Dimension dimension = Dimension.findDimension(this.blocks.keys);
    List<MinecraftBlock> palette = [];
    Map<Pos3D, int> blocks = {};
    for(Pos3D pos in this.blocks.keys) {
      if(!palette.contains(this.blocks[pos])) {
        palette.add(this.blocks[pos]!);
      }
      blocks[pos - dimension.pos] = palette.indexOf(this.blocks[pos]!);
    }
    List<MinecraftEntity> entities = List.generate(this.entities.length, (index) => MinecraftEntity.nbt(this.entities[index].pos -= dimension.pos, this.entities[index].id, this.entities[index].properties));

    List<MapEntry<Pos3D, int>> blockEntries = List.from(blocks.entries);
    NbtCompound compoundTag = NbtCompound<NbtTag>(name: "", children: [
      NbtList<NbtInt>(name: "size", children:
      [NbtInt(name: "0", value: dimension.size.width.ceil()), NbtInt(name: "1", value: dimension.size.height.ceil()), NbtInt(name: "2", value: dimension.size.length.ceil())]
      ),
      NbtList<NbtCompound>(name: "entities", children: List.generate(entities.length, (index) => NbtCompound(name: index.toString(), children: [
        data.entityConfig.nbt(entities[index]),
        NbtList<NbtInt>(name: "blockPos", children:
        [NbtInt(name: "0", value: entities[index].pos.x.floor()), NbtInt(name: "1", value: entities[index].pos.y.floor()), NbtInt(name: "2", value: entities[index].pos.z.floor())]
        ),
        NbtList<NbtDouble>(name: "pos", children:
        [NbtDouble(name: "0", value: entities[index].pos.x), NbtDouble(name: "1", value: entities[index].pos.y), NbtDouble(name: "2", value: entities[index].pos.z)]
        ),
      ]))),
      NbtList<NbtCompound>(name: "blocks", children: List.generate(blockEntries.length, (index) => NbtCompound(name: index.toString(), children: [
        NbtList<NbtInt>(name: "pos", children:
        [NbtInt(name: "0", value: blockEntries[index].key.x.floor()), NbtInt(name: "1", value: blockEntries[index].key.y.floor()), NbtInt(name: "2", value: blockEntries[index].key.z.floor())]
        ),
        NbtInt(name: "state", value: blockEntries[index].value)
      ]))),
      NbtList<NbtCompound>(name: "palette", children: List.generate(palette.length, (index) => NbtCompound(name: index.toString(), children: [
        if(!palette[index].properties.isEmpty)
          NbtCompound<NbtString>(name: "Properties", children: [
            for(String key in palette[index].properties.entries.keys)
              NbtString(name: key, value: palette[index].properties.entries[key].toString())
          ]),
        NbtString(name: "Name", value: palette[index].id)
      ]))),
      NbtInt(name: "DataVersion", value: dataVersion)
    ]);

    NbtWriter(nbtCompression: NbtCompression.gzip).writeFile(file.path, compoundTag);
  }

  void placeBlock(Pos3D pos, MinecraftBlock block, {bool replace = true}) {
    if(!replace) {
      if(!blocks.containsKey(pos)) {
        blocks[pos] = block;
      }
    } else {
      blocks[pos] = block;
    }
  }

  void placeAllBlock(Map<Pos3D, MinecraftBlock> blocks, {bool replace = true}) {
    for(Pos3D pos in blocks.keys) {
      placeBlock(pos, blocks[pos]!, replace: replace);
    }
  }

  void addEntity(MinecraftEntity entity) {
    entities.add(entity);
  }

  void addAllEntity(List<MinecraftEntity> entities) {
    this.entities.addAll(entities);
  }

  @override
  List<Savable> get childrenToMap => [];
}