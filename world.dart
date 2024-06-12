import 'dart:math';

import 'util.dart';

class Pos implements JsonReadable<List> {

  late final double x;
  late final double y;
  late final double z;

  Pos(this.x, this.y, this.z);

  Pos.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    x = json[0].toDouble();
    y = json[1].toDouble();
    z = json[2].toDouble();
  }

  static Pos findPos(Iterable<Pos> poss) {
    Pos found = Pos(double.maxFinite, double.maxFinite, double.maxFinite);
    for(Pos pos in poss) {
      if(pos.x < found.x) found = Pos(pos.x, found.z, found.y);
      if(pos.y < found.y) found = Pos(found.x, found.z, pos.y);
      if(pos.z < found.z) found = Pos(found.x, pos.z, found.y);
    }
    return found;
  }

  operator +(Pos pos) => Pos(x + pos.x, y + pos.y, z + pos.z);

  operator -(Pos pos) => Pos(x - pos.x, y - pos.y, z - pos.z);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Pos &&
              runtimeType == other.runtimeType &&
              x == other.x &&
              y == other.y &&
              z == other.z;

  @override
  int get hashCode => x.hashCode ^ y.hashCode ^ z.hashCode;
}

class Size implements JsonReadable<List> {

  late final double x;
  late final double y;
  late final double z;

  Size(this.x, this.y, this.z);

  Size.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    x = json[0];
    y = json[1];
    z = json[1];
  }

  static Size findSize(Pos pos, Iterable<Pos> poss) {
    Pos found = Pos(-0x8000000000000000, -0x8000000000000000, -0x8000000000000000);
    for(Pos pos in poss) {
      if(pos.x > found.x) found = Pos(pos.x, found.z, found.y);
      if(pos.y > found.y) found = Pos(found.x, found.z, pos.y);
      if(pos.z > found.z) found = Pos(found.x, pos.z, found.y);
    }
    return Size((found.x - pos.x).abs() +1, (pos.z - found.z).abs() +1, (pos.y - found.y).abs() +1);
  }

  operator +(Size pos) => Size(x + pos.x, y + pos.y, z + pos.z);

  operator -(Size pos) => Size(x - pos.x, y - pos.y, z - pos.z);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Pos &&
              runtimeType == other.runtimeType &&
              x == other.x &&
              y == other.y &&
              z == other.z;

  @override
  int get hashCode => x.hashCode ^ y.hashCode ^ z.hashCode;
}

class Dimension {

  late Pos pos;
  late Size size;

  Dimension(this.pos, this.size);

  Dimension.poss(Pos start, Pos end) {
    pos = Pos(min(start.x, end.x), min(start.z, end.z), min(start.y, end.y));
    size = Size((end.x - start.x).abs() +1, (end.z - start.z).abs() +1, (end.y - start.y).abs() +1);
  }

  static Dimension findDimension(Iterable<Pos> poss) {
    Pos pos = Pos.findPos(poss);
    return Dimension(pos, Size.findSize(pos, poss));
  }

  bool contains(Pos contain) =>
      ((contain.x > pos.x && contain.x < pos.x + size.x -1) || size.x == 0) &&
          ((contain.z > pos.z && contain.z < pos.z + size.z -1) || size.z == 0) &&
          ((contain.y > pos.y && contain.y < pos.y + size.y -1) || size.y == 0);

  @override
  String toString() {
    return 'Dimension{pos: $pos, size: $size}';
  }
}

class Rotation3D implements JsonReadable<Map<String, double>> {

  late final double y;
  late final double x;
  late final double z;

  Rotation3D(this.y, this.x, this.z);

  Rotation3D.json(Map<String, double> json) {
    this.json(json);
  }

  @override
  void json(Map<String, double> json) {
    y = json["y"] ?? 0;
    x = json["x"] ?? 0;
    z = json["z"] ?? 0;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Rotation3D &&
              runtimeType == other.runtimeType &&
              y == other.y &&
              x == other.x &&
              z == other.z;

  @override
  int get hashCode => y.hashCode ^ x.hashCode ^ z.hashCode;

  @override
  String toString() {
    return 'Rotation2D{y: $y, x: $x, z: $z}';
  }
}

enum RegularRotation3D {

  north(pi + (pi / 2), 0), east(0, 0), south(pi / 2, 0), west(pi, 0), up(0, pi + (pi / 2)), down(0, pi / 2);

  final double angleY;
  final double angleX;

  const RegularRotation3D(this.angleY, this.angleX);

  Rotation3D get rotation => Rotation3D(angleY, angleX, 0);

  static RegularRotation3D? rotationOf(Rotation3D rotation) {
    if(rotation == north.rotation) {
      return north;
    } else if(rotation == east.rotation) {
      return east;
    } else if(rotation == south.rotation) {
      return south;
    } else if(rotation == west.rotation) {
      return west;
    } else if(rotation == up.rotation) {
      return up;
    } else if(rotation == down.rotation) {
      return down;
    }
    return null;
  }

  static RegularRotation3D? stringOf(String rotation) {
    switch(rotation) {
      case "north": return north;
      case "east": return east;
      case "south": return south;
      case "west": return west;
      case "up": return up;
      case "down": return down;
    }
    return null;
  }
}