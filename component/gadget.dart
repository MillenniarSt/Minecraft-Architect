import '../architect.dart';
import '../style/model.dart';
import 'component.dart';

class MinecraftGadget extends Component<MinecraftGadgetStyle> {

  MinecraftBuildStructure structure;

  MinecraftGadget(super.style, super.dimension) : structure = MinecraftBuildStructure(style.structure, dimension);

  @override
  void random() {
    structure.random();
  }

  @override
  void build(MinecraftArchitect architect) {
    structure.build(architect);
  }
}

class MinecraftGadgetStyle extends ComponentStyle {

  late final MinecraftStructure structure;

  MinecraftGadgetStyle(super.identifier, super.name, this.structure);

  MinecraftGadgetStyle.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    structure = MinecraftStructure.json(json["structure"]);
  }
}