import 'dart:math';

import 'util.dart';

class Pos implements JsonMappable<List> {

  static final Pos zero = Pos(0, 0, 0);

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

  @override
  List toJson() => [x, y, z];

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

  Pos rotate(Pos center, Rotation rotation) {
    double translatedX = x - center.x;
    double translatedY = y - center.y;
    double translatedZ = z - center.z;

    double cosX = cos(rotation.x);
    double sinX = sin(rotation.x);
    double y1 = cosX * translatedY - sinX * translatedZ;
    double z1 = sinX * translatedY + cosX * translatedZ;

    double cosY = cos(rotation.y);
    double sinY = sin(rotation.y);
    double x2 = cosY * translatedX + sinY * z1;
    double z2 = -sinY * translatedX + cosY * z1;

    double cosZ = cos(rotation.z);
    double sinZ = sin(rotation.z);
    double x3 = cosZ * x2 - sinZ * y1;
    double y3 = sinZ * x2 + cosZ * y1;

    return Pos(x3 + center.x, y3 + center.y, z2 + center.z);
  }

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

class Size implements JsonMappable<List> {

  late final double x;
  late final double y;
  late final double z;

  Size(this.x, this.y, this.z);

  Size.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    x = json[0].toDouble();
    y = json[1].toDouble();
    z = json[2].toDouble();
  }

  @override
  List toJson() => [x, y, z];

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

class Dimension implements JsonMappable<Map<String, dynamic>> {

  late Pos pos;
  late Size size;

  Dimension(this.pos, this.size);

  Dimension.poss(Pos start, Pos end) {
    pos = Pos(min(start.x, end.x), min(start.z, end.z), min(start.y, end.y));
    size = Size((end.x - start.x).abs() +1, (end.z - start.z).abs() +1, (end.y - start.y).abs() +1);
  }

  Dimension.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pos = Pos.json(json["pos"]);
    size = Size.json(json["size"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "pos": pos.toJson(),
    "size": size.toJson()
  };

  static Dimension findDimension(Iterable<Pos> poss) {
    Pos pos = Pos.findPos(poss);
    return Dimension(pos, Size.findSize(pos, poss));
  }

  bool contains(Pos contain) =>
      ((contain.x > pos.x && contain.x < pos.x + size.x -1) || size.x == 0) &&
      ((contain.y > pos.y && contain.y < pos.y + size.y -1) || size.y == 0) &&
      ((contain.z > pos.z && contain.z < pos.z + size.z -1) || size.z == 0);

  Dimension? inside(Dimension dim) {
    if(dim.contains(pos)) {
      return Dimension(pos, Size(
          min(size.x, dim.pos.x + dim.size.x - pos.x),
          min(size.y, dim.pos.y + dim.size.y - pos.y),
          min(size.z, dim.pos.z + dim.size.z - pos.z),
      ));
    } else {
      return null;
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Dimension &&
          runtimeType == other.runtimeType &&
          pos == other.pos &&
          size == other.size;

  @override
  int get hashCode => pos.hashCode ^ size.hashCode;
}

class Rotation implements JsonMappable {

  static final Rotation zero = Rotation(0, 0, 0);

  late final double y;
  late final double x;
  late final double z;

  Rotation(this.y, this.x, this.z);

  Rotation.axis(String axis, double angle) {
    switch(axis) {
      case "x": x = angle; y = 0; z = 0;
      case "y": x = 0; y = angle; z = 0;
      case "z": x = 0; y = 0; z = angle;
    }
  }

  Rotation.json(json) {
    this.json(json);
  }

  @override
  void json(json) {
    if(json is List) {
      x = json[0]?.toDouble() ?? 0;
      y = json[1]?.toDouble() ?? 0;
      z = json[2]?.toDouble() ?? 0;
    } else {
      y = json["y"]?.toDouble() ?? 0;
      x = json["x"]?.toDouble() ?? 0;
      z = json["z"]?.toDouble() ?? 0;
    }
  }

  @override
  dynamic toJson({bool asList = true}) {
    if(asList) {
      return [x, y, z];
    } else {
      return {
        if(x != 0) "x": x,
        if(y != 0) "y": y,
        if(z != 0) "z": z
      };
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Rotation &&
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

  Rotation get rotation => Rotation(angleY, angleX, 0);

  static RegularRotation3D? rotationOf(Rotation rotation) {
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