package ryuulogic.com.barber.cita;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import ryuulogic.com.barber.barbero.Barbero;
import ryuulogic.com.barber.cliente.Cliente;
import ryuulogic.com.barber.servicio.Servicio;

import java.sql.Time;
import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
@Entity
@Table(name = "cita")
public class Cita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_cita;
    @Column(nullable = false)
    private Date fecha;
    @Column(nullable = false)
    private Time hora;

    //relaciones
    @ManyToOne(fetch = FetchType.LAZY,optional = false)//
    @JoinColumn(name = "id_servicio")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Servicio servicio;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)//
    @JoinColumn(name = "id_barbero")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Barbero barbero;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)//
    @JoinColumn(name = "id_cliente")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Cliente cliente;
}
