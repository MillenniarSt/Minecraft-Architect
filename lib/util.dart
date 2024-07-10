import 'dart:math';

import 'world.dart';

abstract class JsonReadable<T> {
  void json(T json);
}

abstract class JsonWritable<T> {
  T toJson();

  @override
  String toString() => toJson().toString();
}

abstract class JsonMappable<T> implements JsonReadable<T>, JsonWritable<T> { }

class Identifier implements JsonReadable<String> {

  late final String type;
  late final int? index;

  Identifier(this.type, this.index);

  Identifier.string(String string) {
    json(string);
  }

  @override
  void json(String string) {
    if(string.contains(":")) {
      type = string.substring(0, string.indexOf(":"));
      index = int.tryParse(string.substring(string.indexOf(":") +1));
    } else {
      type = string;
      index = null;
    }
  }
}

class Anchor<N extends num> implements JsonReadable {

  static final Anchor zero = Anchor();

  final Map<RegularRotation3D, N> anchors = {};

  Anchor();

  Anchor.json(json) {
    this.json(json);
  }

  @override
  void json(json) {
    if(json is List<N>) {
      anchors[RegularRotation3D.west] = json[0];
      anchors[RegularRotation3D.down] = json[1];
      anchors[RegularRotation3D.north] = json[2];
    } else if(json is Map<String, N>) {
      for(String anchor in json.keys) {
        anchors[RegularRotation3D.stringOf(anchor)!] = json[anchor]!;
      }
    }
  }

  bool get isRegular => anchors.length <= 3 && !anchors.containsKey(RegularRotation3D.east) && !anchors.containsKey(RegularRotation3D.up) && !anchors.containsKey(RegularRotation3D.south);

  Dimension build(Size container) => Dimension.poss(
      Pos((anchors[RegularRotation3D.west] ?? 0).toDouble(), (anchors[RegularRotation3D.north] ?? 0).toDouble(), (anchors[RegularRotation3D.down] ?? 0).toDouble()),
      Pos(
          (anchors[RegularRotation3D.east] != null ? container.x - anchors[RegularRotation3D.east]! : (anchors[RegularRotation3D.west] ?? 0)).toDouble(),
          (anchors[RegularRotation3D.south] != null ? container.z - anchors[RegularRotation3D.south]! : (anchors[RegularRotation3D.north] ?? 0)).toDouble(),
          (anchors[RegularRotation3D.up] != null ? container.y - anchors[RegularRotation3D.up]! : (anchors[RegularRotation3D.down] ?? 0)).toDouble()
      )
  );

  @override
  bool operator ==(Object other) => identical(this, other) || other is Anchor && runtimeType == other.runtimeType && anchors == other.anchors;

  @override
  int get hashCode => anchors.hashCode;
}

class SizeDependency implements JsonReadable {

  late final Size min;
  late final Size max;

  SizeDependency(this.min, this.max);

  SizeDependency.json(json) {
    this.json(json);
  }

  @override
  void json(map) {
    if(map is Map<String, dynamic>) {
      min = Size(map["min"][0], map["min"][2], map["min"][1]);
      max = Size(map["max"][0], map["max"][2], map["max"][1]);
    } else if(map is List<double>) {
      min = Size(map[0], map[2], map[1]);
      max = Size(map[0], map[2], map[1]);
    }
  }
}

class RandomList<T> {

  final List<T> list;
  final _random = Random();

  RandomList(this.list);

  RandomList.empty() : list = [];

  T get random => list[_random.nextInt(list.length)];
}

class RandomMap<K, V> {

  final Map<K, V> map;
  final _random = Random();

  RandomMap(this.map);

  RandomMap.empty() : map = {};

  MapEntry<K, V> get random => map.entries.elementAt(_random.nextInt(map.length));
}